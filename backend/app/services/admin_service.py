from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.retailer import Retailer, RetailerLicense, RetailerStatus, RetailerMembership
from app.models.product import Product, Inventory
from app.models.order import Order, OrderItem
from app.models.user import User, UserRole
from app.models.compliance import AuditLog, ComplianceApproval
from app.schemas.retailer import RetailerOut, RetailerReviewRequest
from app.schemas.auth import UserOut
from app.schemas.admin import AdminDashboardStats, AuditLogOut, ComplianceApprovalOut, UserUpdateAdmin
from app.services.retailer_service import RetailerService
from app.services.audit_service import AuditService
from app.core.compliance import ComplianceEngine

class AdminService:
    @staticmethod
    def get_pending_retailers(db: Session) -> List[RetailerOut]:
        retailers = db.query(Retailer).filter(Retailer.status == RetailerStatus.PENDING_REVIEW).order_by(Retailer.created_at.asc()).all()
        return [RetailerService.to_retailer_out(db, r) for r in retailers]

    @staticmethod
    def get_all_retailers(db: Session, status_filter: Optional[str] = None) -> List[RetailerOut]:
        query = db.query(Retailer)
        if status_filter:
            query = query.filter(Retailer.status == status_filter)
        retailers = query.order_by(Retailer.created_at.desc()).all()
        return [RetailerService.to_retailer_out(db, r) for r in retailers]

    @staticmethod
    def review_retailer(
        db: Session,
        retailer_id: str,
        review_in: RetailerReviewRequest,
        admin_user: User,
        ip_address: Optional[str] = None
    ) -> RetailerOut:
        retailer = db.query(Retailer).filter(Retailer.id == retailer_id).first()
        if not retailer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")

        old_status = retailer.status
        retailer.status = review_in.status
        retailer.review_notes = review_in.review_notes or f"Updated to {review_in.status.value} by Admin {admin_user.full_name}"

        # Update license if requested
        license_obj = db.query(RetailerLicense).filter(RetailerLicense.retailer_id == retailer.id).first()
        if license_obj and review_in.verify_license:
            license_obj.is_verified = (review_in.status == RetailerStatus.APPROVED)
            license_obj.verified_at = datetime.now(timezone.utc)
            license_obj.verified_by_user_id = admin_user.id

        db.commit()
        db.refresh(retailer)

        AuditService.log_event(
            db=db,
            action="RETAILER_REVIEWED",
            entity_type="retailer",
            actor_user_id=admin_user.id,
            actor_role=admin_user.role.value,
            entity_id=retailer.id,
            ip_address=ip_address,
            details={
                "shop_name": retailer.shop_name,
                "old_status": old_status.value,
                "new_status": review_in.status.value,
                "license_verified": review_in.verify_license
            }
        )

        return RetailerService.to_retailer_out(db, retailer)

    @staticmethod
    def get_dashboard_stats(db: Session) -> AdminDashboardStats:
        total_users = db.query(User).count()
        total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER).count()
        total_retailers = db.query(Retailer).count()
        pending_retailers = db.query(Retailer).filter(Retailer.status == RetailerStatus.PENDING_REVIEW).count()
        approved_retailers = db.query(Retailer).filter(Retailer.status == RetailerStatus.APPROVED).count()
        suspended_retailers = db.query(Retailer).filter(Retailer.status == RetailerStatus.SUSPENDED).count()

        total_products = db.query(Product).count()
        total_inventory_items = db.query(Inventory).count()
        total_simulated_orders = db.query(Order).count()

        return AdminDashboardStats(
            total_users=total_users,
            total_customers=total_customers,
            total_retailers=total_retailers,
            pending_retailers=pending_retailers,
            approved_retailers=approved_retailers,
            suspended_retailers=suspended_retailers,
            total_products=total_products,
            total_inventory_items=total_inventory_items,
            total_simulated_orders=total_simulated_orders,
            compliance_posture=ComplianceEngine.get_compliance_posture()
        )

    @staticmethod
    def get_audit_logs(db: Session, skip: int = 0, limit: int = 50) -> List[AuditLogOut]:
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
        return [AuditLogOut.model_validate(l) for l in logs]

    @staticmethod
    def get_compliance_approvals(db: Session) -> List[ComplianceApprovalOut]:
        approvals = db.query(ComplianceApproval).all()
        return [ComplianceApprovalOut.model_validate(a) for a in approvals]

    @staticmethod
    def get_users(db: Session, role_filter: Optional[str] = None, search: Optional[str] = None) -> List[UserOut]:
        query = db.query(User)
        if role_filter and role_filter != "all":
            query = query.filter(User.role == role_filter)
        if search and search.strip():
            pat = f"%{search.strip()}%"
            query = query.filter(
                (User.full_name.ilike(pat)) |
                (User.email.ilike(pat)) |
                (User.phone.ilike(pat))
            )
        users = query.order_by(User.created_at.desc()).all()
        return [UserOut.model_validate(u) for u in users]

    @staticmethod
    def update_user(
        db: Session,
        user_id: str,
        user_in: UserUpdateAdmin,
        admin_user: User,
        ip_address: Optional[str] = None
    ) -> UserOut:
        target = db.query(User).filter(User.id == user_id).first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if user_in.email and user_in.email != target.email:
            existing = db.query(User).filter(User.email == user_in.email, User.id != user_id).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already taken by another account")
            target.email = user_in.email

        if user_in.full_name is not None:
            target.full_name = user_in.full_name
        if user_in.phone is not None:
            target.phone = user_in.phone
        if user_in.role is not None:
            target.role = user_in.role
        if user_in.is_active is not None:
            target.is_active = user_in.is_active
        if user_in.is_verified is not None:
            target.is_verified = user_in.is_verified

        db.commit()
        db.refresh(target)

        AuditService.log_event(
            db=db,
            action="USER_UPDATED_BY_ADMIN",
            entity_type="user",
            actor_user_id=admin_user.id,
            actor_role=admin_user.role.value,
            entity_id=target.id,
            ip_address=ip_address,
            details={"email": target.email, "role": target.role.value, "is_active": target.is_active}
        )
        return UserOut.model_validate(target)

    @staticmethod
    def delete_user(
        db: Session,
        user_id: str,
        admin_user: User,
        ip_address: Optional[str] = None
    ):
        target = db.query(User).filter(User.id == user_id).first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if target.id == admin_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own active administrator account")

        # Clean up any orders if present (simulated demonstration orders)
        orders = db.query(Order).filter(Order.user_id == target.id).all()
        for ord in orders:
            db.query(OrderItem).filter(OrderItem.order_id == ord.id).delete()
            db.delete(ord)

        # Clean up memberships
        db.query(RetailerMembership).filter(RetailerMembership.user_id == target.id).delete()

        # If user owns a retailer
        retailer = db.query(Retailer).filter(Retailer.user_id == target.id).first()
        if retailer:
            db.delete(retailer)

        db.delete(target)
        db.commit()

        AuditService.log_event(
            db=db,
            action="USER_DELETED_BY_ADMIN",
            entity_type="user",
            actor_user_id=admin_user.id,
            actor_role=admin_user.role.value,
            entity_id=user_id,
            ip_address=ip_address,
            details={"deleted_email": target.email, "deleted_role": target.role.value}
        )
        return {"message": f"User {target.email} was successfully deleted."}
