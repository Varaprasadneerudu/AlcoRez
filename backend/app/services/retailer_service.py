from datetime import datetime, timezone, date
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_, desc, asc, func
from sqlalchemy.orm import Session
from app.models.retailer import Retailer, RetailerLicense, RetailerStatus, RetailerMembership
from app.models.product import Inventory, Product, ProductImage, Category, InventoryMovement
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.retailer import RetailerApplicationCreate, RetailerOut, RetailerLicenseOut, RetailerDashboardOut
from app.schemas.catalog import (
    InventoryCreate,
    InventoryUpdate,
    InventoryOut,
    ProductCreate,
    CategoryOut,
    InventoryMovementOut,
    StockAdjustmentRequest,
    InventorySummaryOut,
    PaginatedInventoryResponse,
)
from app.services.audit_service import AuditService

class RetailerService:
    @staticmethod
    def apply_for_onboarding(
        db: Session,
        user: User,
        app_in: RetailerApplicationCreate,
        ip_address: Optional[str] = None
    ) -> RetailerOut:
        """
        Submit a retailer onboarding application.
        Defaults to PENDING_REVIEW status. Never automatically approved.
        """
        # If user is linking to an existing store:
        if getattr(app_in, 'existing_retailer_id', None):
            store = db.query(Retailer).filter(Retailer.id == app_in.existing_retailer_id).first()
            if not store:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected store not found")
            existing_mem = db.query(RetailerMembership).filter(
                RetailerMembership.retailer_id == store.id,
                RetailerMembership.user_id == user.id
            ).first()
            if not existing_mem:
                membership = RetailerMembership(
                    retailer_id=store.id,
                    user_id=user.id,
                    role_in_retailer="STAFF"
                )
                db.add(membership)
                db.commit()
            AuditService.log_event(
                db=db,
                action="RETAILER_STORE_LINKED",
                entity_type="retailer",
                actor_user_id=user.id,
                actor_role=user.role.value,
                entity_id=store.id,
                ip_address=ip_address,
                details={"shop_name": store.shop_name, "joined_existing": True}
            )
            return RetailerService.to_retailer_out(db, store)

        existing = db.query(Retailer).filter(Retailer.user_id == user.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A retailer onboarding application has already been submitted for this account."
            )

        existing_license = db.query(RetailerLicense).filter(RetailerLicense.license_number == app_in.license_number).first()
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An application or license with number '{app_in.license_number}' already exists in the system."
            )

        # Check if a store with the same shop name in the same city already exists to prevent duplicate stores
        clean_shop_name = app_in.shop_name.strip()
        clean_city = app_in.city.strip()
        existing_store_name = db.query(Retailer).filter(
            func.lower(Retailer.shop_name) == func.lower(clean_shop_name),
            func.lower(Retailer.city) == func.lower(clean_city)
        ).first()
        if existing_store_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"A store named '{clean_shop_name}' is already registered in {clean_city}. "
                    "If your licensed shop is already listed, please select it from the existing stores dropdown to link your account."
                )
            )

        retailer = Retailer(
            user_id=user.id,
            shop_name=app_in.shop_name,
            trade_name=app_in.trade_name,
            contact_person=app_in.contact_person,
            phone=app_in.phone,
            email=app_in.email,
            address_line=app_in.address_line,
            city=app_in.city,
            state=app_in.state,
            postal_code=app_in.postal_code,
            status=RetailerStatus.PENDING_REVIEW,
            review_notes="Application submitted by retailer; pending manual excise document verification."
        )
        db.add(retailer)
        db.flush()

        # License record
        license_entry = RetailerLicense(
            retailer_id=retailer.id,
            license_number=app_in.license_number,
            license_type=app_in.license_type,
            issuing_authority=app_in.issuing_authority,
            issued_date=app_in.issued_date,
            expiry_date=app_in.expiry_date,
            document_url=app_in.document_url,
            is_verified=False
        )
        db.add(license_entry)

        # Membership
        membership = RetailerMembership(
            retailer_id=retailer.id,
            user_id=user.id,
            role_in_retailer="OWNER"
        )
        db.add(membership)
        db.commit()
        db.refresh(retailer)

        AuditService.log_event(
            db=db,
            action="RETAILER_APPLICATION_SUBMITTED",
            entity_type="retailer",
            actor_user_id=user.id,
            actor_role=user.role.value,
            entity_id=retailer.id,
            ip_address=ip_address,
            details={"shop_name": retailer.shop_name, "license_number": license_entry.license_number}
        )

        return RetailerService.to_retailer_out(db, retailer)

    @staticmethod
    def get_retailer_by_user(db: Session, user_id: str) -> Optional[Retailer]:
        retailer = db.query(Retailer).filter(Retailer.user_id == user_id).first()
        if not retailer:
            membership = db.query(RetailerMembership).filter(RetailerMembership.user_id == user_id).first()
            if membership:
                return db.query(Retailer).filter(Retailer.id == membership.retailer_id).first()
        return retailer

    @staticmethod
    def to_inventory_out(inv: Inventory) -> InventoryOut:
        primary_img = None
        if inv.product and inv.product.images:
            for img in inv.product.images:
                if img.is_primary:
                    primary_img = img.image_url
                    break
            if not primary_img and len(inv.product.images) > 0:
                primary_img = inv.product.images[0].image_url

        return InventoryOut(
            id=inv.id,
            retailer_id=inv.retailer_id,
            product_id=inv.product_id,
            bottle_size=inv.bottle_size,
            price=inv.price,
            stock_quantity=inv.stock_quantity,
            is_available=inv.is_available,
            low_stock_threshold=inv.low_stock_threshold,
            version=getattr(inv, "version", 1),
            created_at=inv.created_at,
            updated_at=inv.updated_at,
            retailer_shop_name=inv.retailer.shop_name if inv.retailer else None,
            retailer_status=inv.retailer.status.value if inv.retailer else None,
            retailer_address=f"{inv.retailer.address_line}, {inv.retailer.city}" if inv.retailer else None,
            product_name=inv.product.name if inv.product else None,
            product_brand=inv.product.brand if inv.product else None,
            category_id=inv.product.category_id if inv.product else None,
            category_name=inv.product.category.name if inv.product and inv.product.category else None,
            category_slug=inv.product.category.slug if inv.product and inv.product.category else None,
            primary_image_url=primary_img,
            alcohol_by_volume=inv.product.alcohol_by_volume if inv.product else None,
            country_of_origin=inv.product.country_of_origin if inv.product else None,
        )

    @staticmethod
    def get_retailer_inventory(db: Session, retailer_id: str) -> List[InventoryOut]:
        inventories = db.query(Inventory).filter(Inventory.retailer_id == retailer_id).order_by(desc(Inventory.updated_at)).all()
        return [RetailerService.to_inventory_out(inv) for inv in inventories]

    @staticmethod
    def get_retailer_inventory_paginated(
        db: Session,
        retailer_id: str,
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        brand: Optional[str] = None,
        stock_status: Optional[str] = None,
        listing_status: Optional[str] = None,
        sort_by: Optional[str] = "updated_at",
        sort_order: Optional[str] = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedInventoryResponse:
        base_query = db.query(Inventory).filter(Inventory.retailer_id == retailer_id)

        # Calculate accurate summary metrics across all listings for this authenticated retailer
        all_retailer_items = base_query.all()
        total_listings = len(all_retailer_items)
        in_stock_listings = sum(1 for i in all_retailer_items if i.is_available and i.stock_quantity > 0)
        low_stock_listings = sum(1 for i in all_retailer_items if i.is_available and 0 < i.stock_quantity <= i.low_stock_threshold)
        out_of_stock_listings = sum(1 for i in all_retailer_items if i.stock_quantity == 0)
        inactive_listings = sum(1 for i in all_retailer_items if not i.is_available)
        total_units = sum(i.stock_quantity for i in all_retailer_items)

        summary = InventorySummaryOut(
            total_listings=total_listings,
            in_stock_listings=in_stock_listings,
            low_stock_listings=low_stock_listings,
            out_of_stock_listings=out_of_stock_listings,
            inactive_listings=inactive_listings,
            total_units=total_units,
        )

        # Join Product and Category for filtering & sorting
        query = db.query(Inventory).join(Product, Inventory.product_id == Product.id).outerjoin(Category, Product.category_id == Category.id).filter(Inventory.retailer_id == retailer_id)

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(s),
                    Product.brand.ilike(s),
                    Inventory.bottle_size.ilike(s),
                    Category.name.ilike(s),
                )
            )

        if category_id and category_id.strip():
            query = query.filter(Product.category_id == category_id.strip())

        if brand and brand.strip():
            query = query.filter(Product.brand.ilike(brand.strip()))

        if stock_status:
            status_clean = stock_status.strip().lower()
            if status_clean == "in_stock":
                query = query.filter(Inventory.is_available == True, Inventory.stock_quantity > 0)
            elif status_clean == "low_stock":
                query = query.filter(
                    Inventory.is_available == True,
                    Inventory.stock_quantity > 0,
                    Inventory.stock_quantity <= Inventory.low_stock_threshold,
                )
            elif status_clean == "out_of_stock":
                query = query.filter(Inventory.stock_quantity == 0)

        if listing_status:
            ls_clean = listing_status.strip().lower()
            if ls_clean == "active":
                query = query.filter(Inventory.is_available == True)
            elif ls_clean == "inactive":
                query = query.filter(Inventory.is_available == False)

        total_filtered = query.count()

        order_col = Inventory.updated_at
        if sort_by == "name":
            order_col = Product.name
        elif sort_by == "price":
            order_col = Inventory.price
        elif sort_by == "stock":
            order_col = Inventory.stock_quantity
        elif sort_by == "created_at":
            order_col = Inventory.created_at
        elif sort_by == "updated_at":
            order_col = Inventory.updated_at

        if sort_order == "asc":
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        total_pages = (total_filtered + page_size - 1) // page_size if total_filtered > 0 else 1

        brands = [b[0] for b in db.query(Product.brand).join(Inventory, Inventory.product_id == Product.id).filter(Inventory.retailer_id == retailer_id).distinct().order_by(Product.brand).all()]
        cats = db.query(Category).join(Product, Product.category_id == Category.id).join(Inventory, Inventory.product_id == Product.id).filter(Inventory.retailer_id == retailer_id).distinct().all()
        category_outs = [CategoryOut.model_validate(c) for c in cats]

        return PaginatedInventoryResponse(
            items=[RetailerService.to_inventory_out(i) for i in items],
            total=total_filtered,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            summary=summary,
            categories=category_outs,
            brands=brands,
        )

    @staticmethod
    def add_inventory_item(
        db: Session,
        retailer: Retailer,
        inv_in: InventoryCreate,
        actor_user: User,
        ip_address: Optional[str] = None
    ) -> InventoryOut:
        # Check retailer status
        if retailer.status != RetailerStatus.APPROVED and actor_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only approved licensed retailers can publish products to the catalogue."
            )

        product = db.query(Product).filter(Product.id == inv_in.product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target product not found in catalogue")

        # Check existing inventory for this size (Duplicate Prevention)
        existing = db.query(Inventory).filter(
            Inventory.retailer_id == retailer.id,
            Inventory.product_id == inv_in.product_id,
            Inventory.bottle_size == inv_in.bottle_size
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An inventory listing for size '{inv_in.bottle_size}' already exists for this product."
            )

        if inv_in.price <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price must be strictly positive")

        if inv_in.stock_quantity < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock quantity cannot be negative")

        new_inv = Inventory(
            retailer_id=retailer.id,
            product_id=inv_in.product_id,
            bottle_size=inv_in.bottle_size,
            price=inv_in.price,
            stock_quantity=inv_in.stock_quantity,
            is_available=inv_in.is_available,
            low_stock_threshold=inv_in.low_stock_threshold,
            version=1
        )
        db.add(new_inv)
        db.flush()

        # Record initial movement
        init_movement = InventoryMovement(
            inventory_id=new_inv.id,
            retailer_id=retailer.id,
            previous_quantity=0,
            new_quantity=inv_in.stock_quantity,
            change_quantity=inv_in.stock_quantity,
            reason="INITIAL_LISTING",
            notes="Initial product SKU listing published to shop catalogue",
            actor_user_id=actor_user.id,
            actor_name=actor_user.full_name,
            actor_role=actor_user.role.value
        )
        db.add(init_movement)
        db.commit()
        db.refresh(new_inv)

        AuditService.log_event(
            db=db,
            action="INVENTORY_CREATED",
            entity_type="inventory",
            actor_user_id=actor_user.id,
            actor_role=actor_user.role.value,
            entity_id=new_inv.id,
            ip_address=ip_address,
            details={"retailer_id": retailer.id, "product_id": inv_in.product_id, "price": str(inv_in.price), "stock": inv_in.stock_quantity}
        )

        return RetailerService.to_inventory_out(new_inv)

    @staticmethod
    def adjust_inventory_stock(
        db: Session,
        inventory_id: str,
        retailer: Retailer,
        adj_in: StockAdjustmentRequest,
        actor_user: User,
        ip_address: Optional[str] = None
    ) -> InventoryOut:
        inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory listing not found")

        # Crucial data isolation check
        if inv.retailer_id != retailer.id and actor_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Retailers can only adjust stock in their own inventory"
            )

        if retailer.status != RetailerStatus.APPROVED and actor_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only approved licensed retailers can perform inventory operations."
            )

        # Concurrency check (optimistic locking)
        if adj_in.expected_version is not None and inv.version != adj_in.expected_version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Concurrent modification detected: this inventory item was updated by another request. Please reload and try again."
            )

        if adj_in.new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock quantity cannot be negative"
            )

        old_quantity = inv.stock_quantity
        new_quantity = adj_in.new_quantity
        change = new_quantity - old_quantity

        # Update inventory
        inv.stock_quantity = new_quantity
        inv.version = inv.version + 1
        db.flush()

        # Record structured movement history
        movement = InventoryMovement(
            inventory_id=inv.id,
            retailer_id=retailer.id,
            previous_quantity=old_quantity,
            new_quantity=new_quantity,
            change_quantity=change,
            reason=adj_in.reason,
            notes=adj_in.notes,
            actor_user_id=actor_user.id,
            actor_name=actor_user.full_name,
            actor_role=actor_user.role.value
        )
        db.add(movement)
        db.commit()
        db.refresh(inv)

        from app.services.notification_service import NotificationService
        NotificationService.check_and_notify_low_stock(db, inv)

        AuditService.log_event(
            db=db,
            action="INVENTORY_STOCK_ADJUSTED",
            entity_type="inventory",
            actor_user_id=actor_user.id,
            actor_role=actor_user.role.value,
            entity_id=inv.id,
            ip_address=ip_address,
            details={
                "previous_quantity": old_quantity,
                "new_quantity": new_quantity,
                "change": change,
                "reason": adj_in.reason,
                "notes": adj_in.notes,
                "version": inv.version
            }
        )

        return RetailerService.to_inventory_out(inv)

    @staticmethod
    def get_inventory_movements(
        db: Session,
        inventory_id: str,
        retailer: Retailer,
        actor_user: User
    ) -> List[InventoryMovementOut]:
        inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory listing not found")

        if inv.retailer_id != retailer.id and actor_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Retailers can only view movements for their own inventory"
            )

        movements = db.query(InventoryMovement).filter(InventoryMovement.inventory_id == inventory_id).order_by(desc(InventoryMovement.created_at)).all()
        return [InventoryMovementOut.model_validate(m) for m in movements]

    @staticmethod
    def update_inventory_item(
        db: Session,
        inventory_id: str,
        retailer: Retailer,
        inv_update: InventoryUpdate,
        actor_user: User,
        ip_address: Optional[str] = None
    ) -> InventoryOut:
        inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory listing not found")

        # Crucial data isolation check
        if inv.retailer_id != retailer.id and actor_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Retailers can only modify their own inventory"
            )

        # Optimistic locking check
        if inv_update.expected_version is not None and inv.version != inv_update.expected_version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Concurrent modification detected: this inventory item was updated by another request. Please reload and try again."
            )

        # If bottle_size is being changed, prevent duplicate listings
        if inv_update.bottle_size is not None and inv_update.bottle_size != inv.bottle_size:
            dup = db.query(Inventory).filter(
                Inventory.retailer_id == retailer.id,
                Inventory.product_id == inv.product_id,
                Inventory.bottle_size == inv_update.bottle_size,
                Inventory.id != inv.id
            ).first()
            if dup:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"An inventory listing for size '{inv_update.bottle_size}' already exists for this product."
                )
            inv.bottle_size = inv_update.bottle_size

        old_price = inv.price
        old_stock = inv.stock_quantity

        if inv_update.price is not None:
            if inv_update.price <= 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Price must be strictly positive")
            inv.price = inv_update.price

        if inv_update.stock_quantity is not None:
            if inv_update.stock_quantity < 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock quantity cannot be negative")
            diff = inv_update.stock_quantity - old_stock
            if diff != 0:
                movement = InventoryMovement(
                    inventory_id=inv.id,
                    retailer_id=retailer.id,
                    previous_quantity=old_stock,
                    new_quantity=inv_update.stock_quantity,
                    change_quantity=diff,
                    reason="INLINE_EDIT",
                    notes="Direct quantity edit from inventory management table",
                    actor_user_id=actor_user.id,
                    actor_name=actor_user.full_name,
                    actor_role=actor_user.role.value
                )
                db.add(movement)
            inv.stock_quantity = inv_update.stock_quantity

        if inv_update.is_available is not None:
            inv.is_available = inv_update.is_available
        if inv_update.low_stock_threshold is not None:
            if inv_update.low_stock_threshold < 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Threshold cannot be negative")
            inv.low_stock_threshold = inv_update.low_stock_threshold

        inv.version = inv.version + 1
        db.commit()
        db.refresh(inv)

        from app.services.notification_service import NotificationService
        NotificationService.check_and_notify_low_stock(db, inv)

        AuditService.log_event(
            db=db,
            action="INVENTORY_UPDATED",
            entity_type="inventory",
            actor_user_id=actor_user.id,
            actor_role=actor_user.role.value,
            entity_id=inv.id,
            ip_address=ip_address,
            details={
                "price_change": f"{old_price} -> {inv.price}",
                "stock_change": f"{old_stock} -> {inv.stock_quantity}",
                "version": inv.version
            }
        )

        return RetailerService.to_inventory_out(inv)

    @staticmethod
    def delete_or_deactivate_inventory_item(
        db: Session,
        inventory_id: str,
        retailer: Retailer,
        actor_user: User,
        ip_address: Optional[str] = None
    ) -> dict:
        inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory listing not found")

        if inv.retailer_id != retailer.id and actor_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security violation: Retailers can only modify their own inventory"
            )

        # Check if referenced in order_items
        order_ref = db.query(OrderItem).filter(OrderItem.inventory_id == inv.id).first()
        if order_ref:
            # Cannot hard delete due to regulatory order audit trail: soft deactivate
            inv.is_available = False
            inv.version = inv.version + 1
            movement = InventoryMovement(
                inventory_id=inv.id,
                retailer_id=retailer.id,
                previous_quantity=inv.stock_quantity,
                new_quantity=inv.stock_quantity,
                change_quantity=0,
                reason="DEACTIVATED_ORDER_HISTORY_PRESERVED",
                notes="Listing deactivated instead of deleted because previous order audit records reference this SKU.",
                actor_user_id=actor_user.id,
                actor_name=actor_user.full_name,
                actor_role=actor_user.role.value
            )
            db.add(movement)
            db.commit()

            AuditService.log_event(
                db=db,
                action="INVENTORY_DEACTIVATED_PRESERVED",
                entity_type="inventory",
                actor_user_id=actor_user.id,
                actor_role=actor_user.role.value,
                entity_id=inv.id,
                ip_address=ip_address,
                details={"reason": "Referenced in orders, soft deactivated"}
            )

            return {
                "action": "deactivated",
                "message": "This listing is referenced by previous orders and cannot be permanently deleted. It has been deactivated to preserve statutory audit history.",
                "inventory": RetailerService.to_inventory_out(inv)
            }

        # Otherwise safe to delete
        AuditService.log_event(
            db=db,
            action="INVENTORY_DELETED",
            entity_type="inventory",
            actor_user_id=actor_user.id,
            actor_role=actor_user.role.value,
            entity_id=inv.id,
            ip_address=ip_address,
            details={"bottle_size": inv.bottle_size, "stock_quantity": inv.stock_quantity}
        )
        db.delete(inv)
        db.commit()

        return {
            "action": "deleted",
            "message": "Inventory listing removed successfully."
        }

    @staticmethod
    def get_dashboard_metrics(db: Session, retailer: Retailer) -> RetailerDashboardOut:
        all_items = db.query(Inventory).filter(Inventory.retailer_id == retailer.id).all()
        total_listings = len(all_items)
        active_count = sum(1 for i in all_items if i.is_available and i.stock_quantity > 0)
        low_stock = sum(1 for i in all_items if i.is_available and 0 < i.stock_quantity <= i.low_stock_threshold)
        out_of_stock = sum(1 for i in all_items if i.stock_quantity == 0)
        total_units = sum(i.stock_quantity for i in all_items)
        test_orders = db.query(Order).filter(Order.retailer_id == retailer.id).count()

        # License calculations
        lic = db.query(RetailerLicense).filter(RetailerLicense.retailer_id == retailer.id).first()
        license_days = None
        is_expired = False
        is_expiring_soon = False
        if lic and lic.expiry_date:
            today = date.today()
            license_days = (lic.expiry_date - today).days
            is_expired = license_days < 0
            is_expiring_soon = 0 <= license_days <= 30

            from app.services.notification_service import NotificationService
            NotificationService.check_license_expiry_reminders(db, retailer)

        # Recent movements (up to 5)
        recent_m = db.query(InventoryMovement).filter(InventoryMovement.retailer_id == retailer.id).order_by(desc(InventoryMovement.created_at)).limit(5).all()
        movement_outs = [InventoryMovementOut.model_validate(m) for m in recent_m]

        return RetailerDashboardOut(
            retailer=RetailerService.to_retailer_out(db, retailer),
            total_listings=total_listings,
            active_inventory_count=active_count,
            low_stock_count=low_stock,
            out_of_stock_count=out_of_stock,
            total_units=total_units,
            test_orders_count=test_orders,
            compliance_status=f"Status: {retailer.status.value.upper()} | Commercial delivery: DISABLED",
            license_days_remaining=license_days,
            is_license_expired=is_expired,
            is_license_expiring_soon=is_expiring_soon,
            recent_movements=movement_outs
        )

    @staticmethod
    def to_retailer_out(db: Session, retailer: Retailer) -> RetailerOut:
        if "licenses" in retailer.__dict__ and retailer.licenses:
            lic = retailer.licenses[0]
        else:
            lic = db.query(RetailerLicense).filter(RetailerLicense.retailer_id == retailer.id).first()
        lic_out = RetailerLicenseOut.model_validate(lic) if lic else None

        last_inv_time = db.query(func.max(Inventory.updated_at)).filter(Inventory.retailer_id == retailer.id).scalar()
        active_count = db.query(func.count(Inventory.id)).filter(
            Inventory.retailer_id == retailer.id,
            Inventory.is_available == True,
            Inventory.stock_quantity > 0
        ).scalar() or 0

        return RetailerOut(
            id=retailer.id,
            user_id=retailer.user_id,
            shop_name=retailer.shop_name,
            trade_name=retailer.trade_name,
            contact_person=retailer.contact_person,
            phone=retailer.phone,
            email=retailer.email,
            address_line=retailer.address_line,
            city=retailer.city,
            state=retailer.state,
            postal_code=retailer.postal_code,
            status=retailer.status,
            review_notes=retailer.review_notes,
            created_at=retailer.created_at,
            license=lic_out,
            last_inventory_update=last_inv_time,
            active_products_count=active_count
        )

    # --- Bulk Inventory Import / Export (Feature D) ---

    @staticmethod
    def export_inventory_csv(db: Session, retailer: Retailer) -> str:
        """
        Exports the retailer's inventory as a clean, standardized CSV.
        """
        import csv
        import io
        from sqlalchemy.orm import joinedload

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Product Name",
            "Brand",
            "Category",
            "Bottle Size",
            "Price",
            "Stock Quantity",
            "Available",
            "Low Stock Threshold",
            "Product ID",
            "Inventory ID"
        ])

        inventories = (
            db.query(Inventory)
            .options(joinedload(Inventory.product).joinedload(Product.category))
            .filter(Inventory.retailer_id == retailer.id)
            .order_by(Inventory.created_at.asc())
            .all()
        )

        for inv in inventories:
            p = inv.product
            c_name = p.category.name if (p and p.category) else ""
            writer.writerow([
                p.name if p else "",
                p.brand if p else "",
                c_name,
                inv.bottle_size,
                str(inv.price),
                inv.stock_quantity,
                "TRUE" if inv.is_available else "FALSE",
                inv.low_stock_threshold,
                inv.product_id,
                inv.id
            ])

        return output.getvalue()

    @staticmethod
    def preview_inventory_csv(
        db: Session,
        retailer: Retailer,
        csv_text: str
    ):
        """
        Parses CSV, validates each row against master product catalogue and business rules.
        Returns actionable row-level previews without mutating database.
        """
        import csv
        import io
        from decimal import Decimal, InvalidOperation
        from app.schemas.catalog import InventoryCsvRowPreview, InventoryImportPreviewResponse

        if csv_text.startswith("\ufeff"):
            csv_text = csv_text[1:]

        reader = csv.reader(io.StringIO(csv_text))
        rows_list = list(reader)
        if not rows_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded CSV file is empty"
            )

        # Detect header mapping
        header_idx = -1
        col_map = {}
        for i, row in enumerate(rows_list[:10]):
            norm = [c.strip().lower() for c in row]
            if any(k in norm for k in ["product name", "product_name", "product id", "product_id", "product"]):
                header_idx = i
                for col_pos, cell in enumerate(norm):
                    if cell in ["product name", "product_name", "product"]:
                        col_map["product_name"] = col_pos
                    elif cell in ["brand"]:
                        col_map["brand"] = col_pos
                    elif cell in ["bottle size", "bottle_size", "size"]:
                        col_map["bottle_size"] = col_pos
                    elif cell in ["price", "price (inr)", "rate", "mrp"]:
                        col_map["price"] = col_pos
                    elif cell in ["stock quantity", "stock_quantity", "stock", "quantity", "units"]:
                        col_map["stock_quantity"] = col_pos
                    elif cell in ["available", "is_available"]:
                        col_map["is_available"] = col_pos
                    elif cell in ["low stock threshold", "low_stock_threshold", "threshold"]:
                        col_map["low_stock_threshold"] = col_pos
                    elif cell in ["product id", "product_id"]:
                        col_map["product_id"] = col_pos
                break

        if header_idx == -1:
            header_idx = 0
            col_map = {
                "product_name": 0,
                "brand": 1,
                "bottle_size": 3,
                "price": 4,
                "stock_quantity": 5,
                "is_available": 6,
                "low_stock_threshold": 7,
                "product_id": 8
            }

        all_products = db.query(Product).filter(Product.is_active == True).all()
        products_by_id = {str(p.id): p for p in all_products}
        products_by_name = {p.name.strip().lower(): p for p in all_products}

        current_inv = db.query(Inventory).filter(Inventory.retailer_id == retailer.id).all()
        inv_by_sku = {f"{inv.product_id}_{inv.bottle_size}": inv for inv in current_inv}

        seen_skus = set()
        preview_rows = []
        valid_count = 0
        error_count = 0

        data_rows = rows_list[header_idx + 1:]
        for idx, r in enumerate(data_rows, start=header_idx + 2):
            if not r or all(c.strip() == "" for c in r):
                continue

            row_errors = []
            raw_pid = r[col_map["product_id"]].strip() if "product_id" in col_map and col_map["product_id"] < len(r) else ""
            raw_pname = r[col_map["product_name"]].strip() if "product_name" in col_map and col_map["product_name"] < len(r) else ""
            raw_brand = r[col_map["brand"]].strip() if "brand" in col_map and col_map["brand"] < len(r) else ""
            raw_size = r[col_map["bottle_size"]].strip() if "bottle_size" in col_map and col_map["bottle_size"] < len(r) else ""
            raw_price = r[col_map["price"]].strip() if "price" in col_map and col_map["price"] < len(r) else ""
            raw_stock = r[col_map["stock_quantity"]].strip() if "stock_quantity" in col_map and col_map["stock_quantity"] < len(r) else ""
            raw_avail = r[col_map["is_available"]].strip().lower() if "is_available" in col_map and col_map["is_available"] < len(r) else "true"
            raw_thresh = r[col_map["low_stock_threshold"]].strip() if "low_stock_threshold" in col_map and col_map["low_stock_threshold"] < len(r) else "5"

            # Match product
            matched_product = None
            if raw_pid and raw_pid in products_by_id:
                matched_product = products_by_id[raw_pid]
            elif raw_pname and raw_pname.lower() in products_by_name:
                matched_product = products_by_name[raw_pname.lower()]
            elif raw_pname:
                for p in all_products:
                    if p.name.strip().lower() == raw_pname.lower() or (
                        raw_brand and p.brand.lower() == raw_brand.lower() and p.name.lower().startswith(raw_pname.lower()[:8])
                    ):
                        matched_product = p
                        break

            if not matched_product:
                row_errors.append(f"Product '{raw_pname or raw_pid}' not found in catalogue")

            if not raw_size:
                row_errors.append("Bottle size is required (e.g. 750ml, 375ml)")

            parsed_price = None
            try:
                clean_p = raw_price.replace("₹", "").replace(",", "").strip()
                parsed_price = Decimal(clean_p)
                if parsed_price <= 0:
                    row_errors.append("Price must be greater than 0")
            except (InvalidOperation, ValueError):
                row_errors.append(f"Invalid price value '{raw_price}'")

            parsed_stock = None
            try:
                clean_s = raw_stock.replace(",", "").strip()
                parsed_stock = int(clean_s)
                if parsed_stock < 0:
                    row_errors.append("Stock quantity cannot be negative")
            except ValueError:
                row_errors.append(f"Invalid stock quantity '{raw_stock}'")

            is_available = raw_avail not in ["false", "0", "no", "inactive"]
            parsed_thresh = 5
            try:
                parsed_thresh = int(raw_thresh) if raw_thresh else 5
                if parsed_thresh < 0:
                    parsed_thresh = 5
            except ValueError:
                parsed_thresh = 5

            sku_key = f"{matched_product.id if matched_product else raw_pname}_{raw_size}"
            if sku_key in seen_skus:
                row_errors.append(f"Duplicate entry in CSV for product size {raw_size}")
            else:
                seen_skus.add(sku_key)

            action = "NEW"
            changes_summary = None
            if matched_product and not row_errors:
                existing_inv = inv_by_sku.get(f"{matched_product.id}_{raw_size}")
                if existing_inv:
                    action = "UPDATE"
                    changes_summary = f"Update: Price ₹{existing_inv.price} -> ₹{parsed_price}, Stock {existing_inv.stock_quantity} -> {parsed_stock}"
                else:
                    action = "NEW"
                    changes_summary = f"New listing: ₹{parsed_price}, Stock: {parsed_stock} units"

            status_str = "ERROR" if row_errors else "VALID"
            if status_str == "VALID":
                valid_count += 1
            else:
                error_count += 1

            preview_rows.append(InventoryCsvRowPreview(
                row_number=idx,
                product_id=matched_product.id if matched_product else None,
                product_name=matched_product.name if matched_product else (raw_pname or None),
                brand=matched_product.brand if matched_product else (raw_brand or None),
                bottle_size=raw_size,
                price=parsed_price,
                stock_quantity=parsed_stock,
                is_available=is_available,
                low_stock_threshold=parsed_thresh,
                action=action if not row_errors else "INVALID",
                status=status_str,
                errors=row_errors,
                changes_summary=changes_summary
            ))

        return InventoryImportPreviewResponse(
            total_rows=len(preview_rows),
            valid_rows=valid_count,
            error_rows=error_count,
            rows=preview_rows
        )

    @staticmethod
    def apply_inventory_csv(
        db: Session,
        retailer: Retailer,
        actor_user: User,
        items: list,
        ip_address: Optional[str] = None
    ) -> dict:
        """
        Applies validated bulk CSV items within a transaction.
        Preserves inventory movements history, concurrency versioning, and audit logs.
        """
        from app.services.notification_service import NotificationService
        from app.services.audit_service import AuditService

        imported_count = 0
        updated_count = 0

        for item in items:
            existing = db.query(Inventory).filter(
                Inventory.retailer_id == retailer.id,
                Inventory.product_id == item.product_id,
                Inventory.bottle_size == item.bottle_size
            ).first()

            if existing:
                old_stock = existing.stock_quantity
                change = item.stock_quantity - old_stock

                existing.price = item.price
                existing.stock_quantity = item.stock_quantity
                existing.is_available = item.is_available
                existing.low_stock_threshold = item.low_stock_threshold
                existing.version = existing.version + 1

                if change != 0:
                    movement = InventoryMovement(
                        inventory_id=existing.id,
                        retailer_id=retailer.id,
                        previous_quantity=old_stock,
                        new_quantity=item.stock_quantity,
                        change_quantity=change,
                        reason="BULK_CSV_IMPORT",
                        notes=f"Updated via bulk inventory CSV import (Price: ₹{item.price})",
                        actor_user_id=actor_user.id,
                        actor_name=actor_user.full_name,
                        actor_role=actor_user.role.value
                    )
                    db.add(movement)

                NotificationService.check_and_notify_low_stock(db, existing)
                updated_count += 1
            else:
                new_inv = Inventory(
                    retailer_id=retailer.id,
                    product_id=item.product_id,
                    bottle_size=item.bottle_size,
                    price=item.price,
                    stock_quantity=item.stock_quantity,
                    is_available=item.is_available,
                    low_stock_threshold=item.low_stock_threshold,
                    version=1
                )
                db.add(new_inv)
                db.flush()

                movement = InventoryMovement(
                    inventory_id=new_inv.id,
                    retailer_id=retailer.id,
                    previous_quantity=0,
                    new_quantity=item.stock_quantity,
                    change_quantity=item.stock_quantity,
                    reason="BULK_CSV_IMPORT",
                    notes="Created via bulk inventory CSV import",
                    actor_user_id=actor_user.id,
                    actor_name=actor_user.full_name,
                    actor_role=actor_user.role.value
                )
                db.add(movement)

                NotificationService.check_and_notify_low_stock(db, new_inv)
                imported_count += 1

        db.commit()

        AuditService.log_event(
            db=db,
            action="INVENTORY_BULK_IMPORTED",
            entity_type="retailer_inventory",
            actor_user_id=actor_user.id,
            actor_role=actor_user.role.value,
            entity_id=retailer.id,
            ip_address=ip_address,
            details={
                "imported_count": imported_count,
                "updated_count": updated_count,
                "total": imported_count + updated_count
            }
        )

        return {
            "imported_count": imported_count,
            "updated_count": updated_count,
            "total_processed": imported_count + updated_count,
            "message": f"Successfully processed {imported_count + updated_count} inventory listings ({imported_count} new, {updated_count} updated)."
        }
