from datetime import date, datetime, timedelta, timezone

from app.models.compliance import Notification
from app.models.order import Order, OrderStatus
from app.models.product import Inventory
from app.models.retailer import Retailer, RetailerLicense, RetailerStatus
from app.models.user import User
from fastapi import HTTPException, status
from sqlalchemy import desc, func
from sqlalchemy.orm import Session


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "INFO",
        commit: bool = True
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False
        )
        db.add(notif)
        if commit:
            db.commit()
            db.refresh(notif)
        else:
            db.flush()
        return notif

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: str,
        unread_only: bool = False,
        page: int = 1,
        limit: int = 20
    ) -> tuple[list[Notification], int, int]:
        base_query = db.query(Notification).filter(Notification.user_id == user_id)
        unread_count = db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).scalar() or 0

        query = base_query
        if unread_only:
            query = query.filter(Notification.is_read == False)

        total = query.count()
        skip = (page - 1) * limit
        items = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        return items, total, unread_count

    @staticmethod
    def get_unread_count(db: Session, user_id: str) -> int:
        return db.query(func.count(Notification.id)).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).scalar() or 0

    @staticmethod
    def mark_as_read(db: Session, notification_id: str, user_id: str) -> Notification:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if not notif:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found or access unauthorized"
            )
        notif.is_read = True
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_read(db: Session, user_id: str) -> int:
        updated = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True}, synchronize_session=False)
        db.commit()
        return updated

    # --- Real Application Event Generators ---

    @staticmethod
    def check_and_notify_low_stock(db: Session, inventory: Inventory, commit: bool = True):
        """
        Generates a low stock alert when inventory drops at or below low_stock_threshold.
        Prevents spamming by checking if an unread LOW_STOCK notification exists for this item.
        """
        if inventory.stock_quantity <= inventory.low_stock_threshold:
            retailer = inventory.retailer or db.query(Retailer).filter(Retailer.id == inventory.retailer_id).first()
            if not retailer or not retailer.user_id:
                return

            p_name = inventory.product.name if inventory.product else "Spirits item"
            recent = db.query(Notification).filter(
                Notification.user_id == retailer.user_id,
                Notification.notification_type == "LOW_STOCK",
                Notification.is_read == False,
                Notification.message.like(f"%{inventory.id}%")
            ).first()

            if not recent:
                title = f"Low Stock Warning: {p_name} ({inventory.bottle_size})"
                msg = (
                    f"Listing [{inventory.id}]: Stock quantity has dropped to {inventory.stock_quantity} units "
                    f"(Threshold: {inventory.low_stock_threshold}). Please update inventory to prevent stockout."
                )
                NotificationService.create_notification(
                    db=db,
                    user_id=retailer.user_id,
                    title=title,
                    message=msg,
                    notification_type="LOW_STOCK",
                    commit=commit
                )

    @staticmethod
    def notify_retailer_review(
        db: Session,
        retailer: Retailer,
        old_status: RetailerStatus,
        new_status: RetailerStatus,
        notes: str | None = None
    ):
        """
        Generates a notification to the retailer user when an administrator reviews their application.
        """
        if not retailer.user_id:
            return

        status_label = new_status.value.replace("_", " ").title()
        title = f"Licensing Review Update: {status_label}"
        message = (
            f"Your excise retail account for '{retailer.shop_name}' was reviewed by state administration. "
            f"New Status: {new_status.value.upper()}. Remarks: {notes or 'No remarks provided.'}"
        )
        NotificationService.create_notification(
            db=db,
            user_id=retailer.user_id,
            title=title,
            message=message,
            notification_type="RETAILER_REVIEW"
        )

    @staticmethod
    def check_license_expiry_reminders(db: Session, retailer: Retailer):
        """
        Checks if retailer license is expiring within 30 days or has expired and notifies retailer.
        """
        lic = db.query(RetailerLicense).filter(RetailerLicense.retailer_id == retailer.id).first()
        if not lic or not lic.expiry_date or not retailer.user_id:
            return

        today = date.today()
        days_left = (lic.expiry_date - today).days

        if days_left < 0:
            title = "CRITICAL: Excise Retail License Expired"
            msg = f"Your A4 Retail License ({lic.license_number}) expired on {lic.expiry_date}. Immediate renewal required."
            n_type = "LICENSE_EXPIRY"
        elif days_left <= 30:
            title = f"Urgent: Excise License Expiring in {days_left} Days"
            msg = f"Your A4 Retail License ({lic.license_number}) is valid until {lic.expiry_date}. Please file renewal documents."
            n_type = "LICENSE_EXPIRY"
        else:
            return

        # Check if already notified in last 7 days
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        existing = db.query(Notification).filter(
            Notification.user_id == retailer.user_id,
            Notification.notification_type == n_type,
            Notification.created_at >= seven_days_ago
        ).first()

        if not existing:
            NotificationService.create_notification(
                db=db,
                user_id=retailer.user_id,
                title=title,
                message=msg,
                notification_type=n_type
            )

    @staticmethod
    def notify_order_created(db: Session, order: Order, retailer: Retailer | None, customer: User):
        """
        Notifies both customer and retailer when a new simulated order is placed.
        """
        # 1. Customer Notification
        shop_name = retailer.shop_name if retailer else "Licensed Wine Store"
        cust_title = f"Reservation Confirmed: #{order.order_number}"
        cust_msg = (
            f"Your simulated reservation #{order.order_number} for {shop_name} has been placed. "
            f"Total: ₹{order.total_amount}. Mode: In-Store Pickup ({order.address_snapshot})."
        )
        NotificationService.create_notification(
            db=db,
            user_id=customer.id,
            title=cust_title,
            message=cust_msg,
            notification_type="ORDER_UPDATE"
        )

        # 2. Retailer Notification
        if retailer and retailer.user_id:
            ret_title = f"New Reservation Received: #{order.order_number}"
            ret_msg = (
                f"New customer reservation #{order.order_number} received from {customer.full_name or 'a customer'}. "
                f"Total: ₹{order.total_amount}. Pick-up schedule: In-store demonstration."
            )
            NotificationService.create_notification(
                db=db,
                user_id=retailer.user_id,
                title=ret_title,
                message=ret_msg,
                notification_type="ORDER_UPDATE"
            )

    @staticmethod
    def notify_order_status(db: Session, order: Order, old_status: OrderStatus, new_status: OrderStatus):
        """
        Notifies customer of changes in simulated order status (e.g. PREPARING, READY).
        """
        if not order.user_id:
            return

        status_text = new_status.value.replace("_", " ").title()
        title = f"Reservation Update: #{order.order_number}"
        msg = f"Your reservation #{order.order_number} status is now '{status_text}'. Total amount: ₹{order.total_amount}."
        NotificationService.create_notification(
            db=db,
            user_id=order.user_id,
            title=title,
            message=msg,
            notification_type="ORDER_UPDATE"
        )
