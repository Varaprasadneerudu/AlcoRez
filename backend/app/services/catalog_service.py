from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy import or_, and_, asc, desc
from sqlalchemy.orm import Session, joinedload
from app.models.product import Category, Product, ProductImage, Inventory
from app.models.retailer import Retailer, RetailerStatus
from app.schemas.catalog import ProductOut, ProductDetailOut, ProductImageOut, InventoryOut, CategoryOut

class CatalogService:
    @staticmethod
    def get_categories(db: Session, active_only: bool = True) -> List[CategoryOut]:
        query = db.query(Category)
        if active_only:
            query = query.filter(Category.is_active == True)
        categories = query.order_by(Category.name.asc()).all()
        return [CategoryOut.model_validate(c) for c in categories]

    @staticmethod
    def get_products(
        db: Session,
        search: Optional[str] = None,
        category_slug: Optional[str] = None,
        retailer_id: Optional[str] = None,
        bottle_size: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        sort_by: str = "name_asc", # name_asc, name_desc, price_asc, price_desc
        skip: int = 0,
        limit: int = 24
    ) -> Tuple[List[ProductOut], int]:
        """
        Query catalogue showing only active products from approved retailers.
        """
        # Base query joining Product, Category, and Inventory
        query = (
            db.query(Product)
            .join(Category, Product.category_id == Category.id)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
            .outerjoin(Retailer, Inventory.retailer_id == Retailer.id)
            .filter(Product.is_active == True)
        )

        # Only link to approved retailers if an inventory item exists
        if retailer_id:
            query = query.filter(
                Inventory.retailer_id == retailer_id,
                Retailer.status == RetailerStatus.APPROVED
            )
        else:
            # If no retailer filter, filter out inventory from non-approved retailers
            query = query.filter(
                or_(
                    Inventory.id == None,
                    Retailer.status == RetailerStatus.APPROVED
                )
            )

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

        if bottle_size:
            query = query.filter(Inventory.bottle_size == bottle_size)

        if min_price is not None:
            query = query.filter(Inventory.price >= min_price)

        if max_price is not None:
            query = query.filter(Inventory.price <= max_price)

        # Deduplicate product query
        query = query.distinct()

        # Sorting
        if sort_by == "name_desc":
            query = query.order_by(Product.name.desc())
        elif sort_by == "price_asc":
            query = query.order_by(Inventory.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Inventory.price.desc())
        else:
            query = query.order_by(Product.name.asc())

        total = query.count()
        products = query.offset(skip).limit(limit).all()

        results = []
        for p in products:
            # Fetch primary image
            primary_img = db.query(ProductImage).filter(
                ProductImage.product_id == p.id,
                ProductImage.is_primary == True
            ).first()
            if not primary_img:
                primary_img = db.query(ProductImage).filter(ProductImage.product_id == p.id).first()

            # Fetch approved inventories
            inv_list = (
                db.query(Inventory)
                .join(Retailer, Inventory.retailer_id == Retailer.id)
                .filter(
                    Inventory.product_id == p.id,
                    Inventory.is_available == True,
                    Retailer.status == RetailerStatus.APPROVED
                )
                .all()
            )

            min_price_val = min([inv.price for inv in inv_list]) if inv_list else None
            sizes = sorted(list(set([inv.bottle_size for inv in inv_list])))
            has_stock = any([inv.stock_quantity > 0 for inv in inv_list])

            category_name = p.category.name if p.category else None
            category_slug_val = p.category.slug if p.category else None

            results.append(
                ProductOut(
                    id=p.id,
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
                    primary_image_url=primary_img.image_url if primary_img else "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80",
                    starting_price=min_price_val,
                    available_sizes=sizes,
                    in_stock=has_stock
                )
            )

        return results, total

    @staticmethod
    def get_product_details(db: Session, product_id: str) -> Optional[ProductDetailOut]:
        product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
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

        # Inventories from approved retailers
        inventories = (
            db.query(Inventory)
            .join(Retailer, Inventory.retailer_id == Retailer.id)
            .filter(
                Inventory.product_id == product.id,
                Retailer.status == RetailerStatus.APPROVED
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
                retailer_status=inv.retailer.status.value,
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
