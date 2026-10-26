from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.retailer import Retailer, RetailerLicense, RetailerStatus, RetailerMembership
from app.models.product import Inventory, Product, ProductImage
from app.models.order import Order
from app.models.user import User
from app.schemas.retailer import RetailerApplicationCreate, RetailerOut, RetailerLicenseOut, RetailerDashboardOut
from app.schemas.catalog import InventoryCreate, InventoryUpdate, InventoryOut, ProductCreate
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
    def get_retailer_inventory(db: Session, retailer_id: str) -> List[InventoryOut]:
        inventories = db.query(Inventory).filter(Inventory.retailer_id == retailer_id).all()
        results = []
        for inv in inventories:
            results.append(
                InventoryOut(
                    id=inv.id,
                    retailer_id=inv.retailer_id,
                    product_id=inv.product_id,
                    bottle_size=inv.bottle_size,
                    price=inv.price,
                    stock_quantity=inv.stock_quantity,
                    is_available=inv.is_available,
                    retailer_shop_name=inv.retailer.shop_name if inv.retailer else None,
                    retailer_status=inv.retailer.status.value if inv.retailer else None,
                    retailer_address=f"{inv.retailer.address_line}, {inv.retailer.city}" if inv.retailer else None
                )
            )
        return results

    @staticmethod
    def add_inventory_item(
        db: Session,
        retailer: Retailer,
        inv_in: InventoryCreate,
        actor_user: User,
        ip_address: Optional[str] = None
    ) -> InventoryOut:
        # Check retailer status
        if retailer.status != RetailerStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only approved licensed retailers can publish products to the catalogue."
            )

        product = db.query(Product).filter(Product.id == inv_in.product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target product not found in catalogue")

        # Check existing inventory for this size
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

        new_inv = Inventory(
            retailer_id=retailer.id,
            product_id=inv_in.product_id,
            bottle_size=inv_in.bottle_size,
            price=inv_in.price,
            stock_quantity=inv_in.stock_quantity,
            is_available=inv_in.is_available,
            low_stock_threshold=inv_in.low_stock_threshold
        )
        db.add(new_inv)
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
            details={"retailer_id": retailer.id, "product_id": inv_in.product_id, "price": str(inv_in.price)}
        )

        return InventoryOut(
            id=new_inv.id,
            retailer_id=new_inv.retailer_id,
            product_id=new_inv.product_id,
            bottle_size=new_inv.bottle_size,
            price=new_inv.price,
            stock_quantity=new_inv.stock_quantity,
            is_available=new_inv.is_available,
            retailer_shop_name=retailer.shop_name,
            retailer_status=retailer.status.value,
            retailer_address=f"{retailer.address_line}, {retailer.city}"
        )

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

        old_price = inv.price
        old_stock = inv.stock_quantity

        if inv_update.price is not None:
            inv.price = inv_update.price
        if inv_update.stock_quantity is not None:
            inv.stock_quantity = inv_update.stock_quantity
        if inv_update.is_available is not None:
            inv.is_available = inv_update.is_available
        if inv_update.bottle_size is not None:
            inv.bottle_size = inv_update.bottle_size
        if inv_update.low_stock_threshold is not None:
            inv.low_stock_threshold = inv_update.low_stock_threshold

        db.commit()
        db.refresh(inv)

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
                "stock_change": f"{old_stock} -> {inv.stock_quantity}"
            }
        )

        return InventoryOut(
            id=inv.id,
            retailer_id=inv.retailer_id,
            product_id=inv.product_id,
            bottle_size=inv.bottle_size,
            price=inv.price,
            stock_quantity=inv.stock_quantity,
            is_available=inv.is_available,
            retailer_shop_name=retailer.shop_name,
            retailer_status=retailer.status.value,
            retailer_address=f"{retailer.address_line}, {retailer.city}"
        )

    @staticmethod
    def get_dashboard_metrics(db: Session, retailer: Retailer) -> RetailerDashboardOut:
        total_listings = db.query(Inventory).filter(Inventory.retailer_id == retailer.id).count()
        active_count = db.query(Inventory).filter(
            Inventory.retailer_id == retailer.id,
            Inventory.is_available == True,
            Inventory.stock_quantity > 0
        ).count()
        low_stock = db.query(Inventory).filter(
            Inventory.retailer_id == retailer.id,
            Inventory.stock_quantity <= Inventory.low_stock_threshold
        ).count()
        test_orders = db.query(Order).filter(Order.retailer_id == retailer.id).count()

        return RetailerDashboardOut(
            retailer=RetailerService.to_retailer_out(db, retailer),
            total_listings=total_listings,
            active_inventory_count=active_count,
            low_stock_count=low_stock,
            test_orders_count=test_orders,
            compliance_status=f"Status: {retailer.status.value.upper()} | Commercial delivery: DISABLED"
        )

    @staticmethod
    def to_retailer_out(db: Session, retailer: Retailer) -> RetailerOut:
        lic = db.query(RetailerLicense).filter(RetailerLicense.retailer_id == retailer.id).first()
        lic_out = RetailerLicenseOut.model_validate(lic) if lic else None
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
            license=lic_out
        )
