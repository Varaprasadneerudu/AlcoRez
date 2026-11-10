from datetime import datetime, timezone
from decimal import Decimal

from app.models.product import Category, Inventory, Product, ProductImage
from app.models.retailer import Retailer, RetailerLicense, RetailerStatus
from app.schemas.catalog import (
    CategoryOut,
    InventoryOut,
    ProductDetailOut,
    ProductImageOut,
    ProductInventorySummary,
    ProductOut,
)
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload


class CatalogService:
    @staticmethod
    def get_categories(db: Session, active_only: bool = True) -> list[CategoryOut]:
        query = db.query(Category)
        if active_only:
            query = query.filter(Category.is_active == True)
        categories = query.order_by(Category.name.asc()).all()
        return [CategoryOut.model_validate(c) for c in categories]

    @staticmethod
    def get_brands(db: Session) -> list[str]:
        rows = (
            db.query(Product.brand)
            .filter(Product.is_active == True, Product.brand.is_not(None), Product.brand != "")
            .distinct()
            .order_by(Product.brand.asc())
            .all()
        )
        return [r[0] for r in rows if r[0]]

    @staticmethod
    def get_products(
        db: Session,
        search: str | None = None,
        category_slug: str | None = None,
        brand: str | None = None,
        retailer_id: str | None = None,
        bottle_size: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        sort_by: str = "name_asc", # name_asc, name_desc, price_asc, price_desc
        skip: int = 0,
        limit: int = 24,
        product_ids: list[str] | None = None,
        postal_code: str | None = None
    ) -> tuple[list[ProductOut], int]:
        """
        Query catalogue showing only active products from approved retailers with valid excise licenses.
        Supports filtering by specific product_ids and retailer postal_code locality.
        Consistently enforces availability and filter parameters across matching, counts, and returned inventory.
        """
        today = datetime.now(timezone.utc).date()
        valid_retailer_subquery = (
            db.query(RetailerLicense.retailer_id)
            .filter(
                RetailerLicense.is_verified == True,
                or_(RetailerLicense.expiry_date.is_(None), RetailerLicense.expiry_date >= today)
            )
            .scalar_subquery()
        )

        # Determine if inventory/retailer joins are needed for filtering or sorting
        needs_inventory_join = bool(
            retailer_id
            or postal_code
            or bottle_size
            or min_price is not None
            or max_price is not None
            or sort_by in ("price_asc", "price_desc")
        )

        # Base query joining Product and Category
        query = db.query(Product).join(Category, Product.category_id == Category.id).filter(Product.is_active == True)

        if needs_inventory_join:
            query = (
                query
                .join(Inventory, Product.id == Inventory.product_id)
                .join(Retailer, Inventory.retailer_id == Retailer.id)
                .filter(
                    Inventory.is_available == True,
                    Inventory.stock_quantity > 0,
                    Retailer.status == RetailerStatus.APPROVED,
                    Retailer.id.in_(valid_retailer_subquery)
                )
            )

            # Only link to approved retailers if an inventory item exists
            if retailer_id:
                query = query.filter(Inventory.retailer_id == retailer_id)
            if postal_code:
                query = query.filter(Retailer.postal_code == postal_code)
            if bottle_size:
                query = query.filter(Inventory.bottle_size == bottle_size)
            if min_price is not None:
                query = query.filter(Inventory.price >= min_price)
            if max_price is not None:
                query = query.filter(Inventory.price <= max_price)

            query = query.distinct()

        # Product IDs filter (for favorites or specific selection)
        if product_ids is not None:
            query = query.filter(Product.id.in_(product_ids))

        # Filters
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.brand.ilike(search_term),
                    Category.name.ilike(search_term)
                )
            )

        if category_slug:
            query = query.filter(Category.slug == category_slug)

        if brand and brand.strip():
            query = query.filter(Product.brand.ilike(brand.strip()))

        # Sorting
        if sort_by == "name_desc":
            query = query.order_by(Product.name.desc())
        elif sort_by == "price_asc":
            if needs_inventory_join:
                query = query.order_by(Inventory.price.asc())
            else:
                query = query.order_by(Product.name.asc())
        elif sort_by == "price_desc":
            if needs_inventory_join:
                query = query.order_by(Inventory.price.desc())
            else:
                query = query.order_by(Product.name.desc())
        else:
            query = query.order_by(Product.name.asc())

        total = query.count()
        products = query.options(joinedload(Product.category)).offset(skip).limit(limit).all()

        if not products:
            return [], total

        fetched_product_ids: list[str] = [str(p.id) for p in products]

        # 1. Batch fetch primary & secondary images for all products in 1 query
        images = (
            db.query(ProductImage)
            .filter(ProductImage.product_id.in_(fetched_product_ids))
            .order_by(ProductImage.is_primary.desc())
            .all()
        )
        images_by_product: dict[str, str] = {}
        for img in images:
            img_pid = str(img.product_id)
            if img_pid not in images_by_product:
                images_by_product[img_pid] = str(img.image_url)

        # 2. Batch fetch active inventory from approved retailers with valid licenses in 1 query, applying requested filters
        inv_query = (
            db.query(Inventory)
            .join(Retailer, Inventory.retailer_id == Retailer.id)
            .filter(
                Inventory.product_id.in_(fetched_product_ids),
                Inventory.is_available == True,
                Inventory.stock_quantity > 0,
                Retailer.status == RetailerStatus.APPROVED,
                Retailer.id.in_(valid_retailer_subquery)
            )
        )
        if retailer_id:
            inv_query = inv_query.filter(Inventory.retailer_id == retailer_id)
        if postal_code:
            inv_query = inv_query.filter(Retailer.postal_code == postal_code)
        if bottle_size:
            inv_query = inv_query.filter(Inventory.bottle_size == bottle_size)
        if min_price is not None:
            inv_query = inv_query.filter(Inventory.price >= min_price)
        if max_price is not None:
            inv_query = inv_query.filter(Inventory.price <= max_price)

        all_invs = inv_query.all()
        inv_by_product: dict[str, list[Inventory]] = {pid: [] for pid in fetched_product_ids}
        for inv in all_invs:
            inv_pid = str(inv.product_id)
            if inv_pid in inv_by_product:
                inv_by_product[inv_pid].append(inv)

        # 3. Assemble response objects in-memory with 0 extra DB roundtrips
        results = []
        for p in products:
            p_id = str(p.id)
            inv_list = inv_by_product.get(p_id, [])
            min_price_val = min(inv.price for inv in inv_list) if inv_list else None
            sizes = sorted({str(inv.bottle_size) for inv in inv_list})
            has_stock = any(inv.stock_quantity > 0 for inv in inv_list)

            # In-stock inventories sorted by price asc
            in_stock_invs = [inv for inv in inv_list if inv.stock_quantity > 0 and inv.is_available]
            in_stock_invs.sort(key=lambda x: x.price)
            default_inv_id = str(in_stock_invs[0].id) if in_stock_invs else (str(inv_list[0].id) if inv_list else None)

            inv_summaries = [
                ProductInventorySummary(
                    id=str(inv.id),
                    bottle_size=str(inv.bottle_size),
                    price=inv.price,
                    stock_quantity=inv.stock_quantity,
                    is_available=bool(inv.is_available and inv.stock_quantity > 0)
                )
                for inv in inv_list
            ]

            category_name = str(p.category.name) if p.category else None
            category_slug_val = str(p.category.slug) if p.category else None
            primary_url = images_by_product.get(
                p_id,
                "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80"
            )

            results.append(
                ProductOut(
                    id=p_id,
                    name=p.name,
                    brand=p.brand,
                    category_id=p.category_id,
                    category_name=category_name,
                    category_slug=category_slug_val,
                    description=p.description,
                    alcohol_by_volume=p.alcohol_by_volume,
                    country_of_origin=p.country_of_origin,
                    is_active=p.is_active,
                    is_demo_data=p.is_demo_data,
                    primary_image_url=primary_url,
                    starting_price=min_price_val,
                    available_sizes=sizes,
                    in_stock=has_stock,
                    default_inventory_id=default_inv_id,
                    inventories=inv_summaries
                )
            )

        return results, total

    @staticmethod
    def get_product_details(db: Session, product_id: str) -> ProductDetailOut | None:
        product = (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.id == product_id, Product.is_active == True)
            .first()
        )
        if not product:
            return None

        # Images
        images = db.query(ProductImage).filter(ProductImage.product_id == product.id).all()
        image_outs = [ProductImageOut.model_validate(img) for img in images]
        if not image_outs:
            image_outs = [ProductImageOut(
                id="default",
                image_url="https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80",
                is_primary=True
            )]

        # Inventories from approved retailers with valid licenses that are active
        today = datetime.now(timezone.utc).date()
        valid_retailer_subquery = (
            db.query(RetailerLicense.retailer_id)
            .filter(
                RetailerLicense.is_verified == True,
                or_(RetailerLicense.expiry_date.is_(None), RetailerLicense.expiry_date >= today)
            )
            .scalar_subquery()
        )

        inventories = (
            db.query(Inventory)
            .options(joinedload(Inventory.retailer))
            .join(Retailer, Inventory.retailer_id == Retailer.id)
            .filter(
                Inventory.product_id == product.id,
                Inventory.is_available == True,
                Retailer.status == RetailerStatus.APPROVED,
                Retailer.id.in_(valid_retailer_subquery)
            )
            .all()
        )

        inventory_outs = []
        for inv in inventories:
            inv_out = InventoryOut(
                id=inv.id,
                retailer_id=inv.retailer_id,
                product_id=inv.product_id,
                bottle_size=inv.bottle_size,
                price=inv.price,
                stock_quantity=inv.stock_quantity,
                is_available=inv.is_available and inv.stock_quantity > 0,
                retailer_shop_name=inv.retailer.shop_name,
                retailer_status=inv.retailer.status.value if hasattr(inv.retailer.status, "value") else str(inv.retailer.status),
                retailer_address=f"{inv.retailer.address_line}, {inv.retailer.city}"
            )
            inventory_outs.append(inv_out)

        return ProductDetailOut(
            id=product.id,
            name=product.name,
            brand=product.brand,
            category_id=product.category_id,
            category_name=product.category.name if product.category else None,
            description=product.description,
            alcohol_by_volume=product.alcohol_by_volume,
            country_of_origin=product.country_of_origin,
            is_active=product.is_active,
            is_demo_data=product.is_demo_data,
            images=image_outs,
            inventories=inventory_outs
        )
