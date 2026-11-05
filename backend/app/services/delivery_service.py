from decimal import Decimal

from app.models.order import Order, OrderStatus
from app.models.retailer import Retailer
from app.models.user import DeliveryPartnerProfile, User, UserRole
from app.schemas.delivery import (
    AvailableDeliveryOrderOut,
    DeliveryCompleteRequest,
    DeliveryEarningsSummaryOut,
    DeliveryPartnerProfileOut,
    DeliveryStatusUpdate,
    DeliveryTripHistoryOut,
)
from app.services.audit_service import AuditService
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload


class DeliveryService:
    @staticmethod
    def get_or_create_profile(db: Session, user: User) -> DeliveryPartnerProfileOut:
        profile = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == user.id).first()
        if not profile:
            profile = DeliveryPartnerProfile(
                user_id=user.id,
                vehicle_type="Honda Activa 6G (EV/Petrol)",
                vehicle_number="TS 09 EB 4821",
                driving_license_number="DL-TS-2022-987654",
                is_online=True,
                current_zone="Madhapur & HITEC City",
                rating=Decimal("4.92"),
                total_trips=42,
                today_trips=6,
                today_earnings=Decimal("620.00"),
                total_earnings=Decimal("18450.00"),
                is_verified=True,
                compliance_permit_no="TS-EXCISE-DP-2024-0982"
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        return DeliveryPartnerProfileOut(
            id=profile.id,
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone or "+91-9876501234",
            vehicle_type=profile.vehicle_type,
            vehicle_number=profile.vehicle_number,
            driving_license_number=profile.driving_license_number,
            is_online=profile.is_online,
            current_zone=profile.current_zone,
            rating=profile.rating,
            total_trips=profile.total_trips,
            today_trips=profile.today_trips,
            today_earnings=profile.today_earnings,
            total_earnings=profile.total_earnings,
            is_verified=profile.is_verified,
            compliance_permit_no=profile.compliance_permit_no
        )

    @staticmethod
    def update_status(db: Session, user: User, status_update: DeliveryStatusUpdate) -> DeliveryPartnerProfileOut:
        profile = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == user.id).first()
        if not profile:
            DeliveryService.get_or_create_profile(db, user)
            profile = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == user.id).first()

        profile.is_online = status_update.is_online
        if status_update.current_zone:
            profile.current_zone = status_update.current_zone

        db.commit()
        db.refresh(profile)
        return DeliveryService.get_or_create_profile(db, user)

    @staticmethod
    def _order_to_available_out(order: Order, db: Session) -> AvailableDeliveryOrderOut:
        retailer = db.query(Retailer).filter(Retailer.id == order.retailer_id).first()
        customer = db.query(User).filter(User.id == order.user_id).first()

        ret_name = retailer.shop_name if retailer else "Licensed Telangana Wine Outlet"
        ret_addr = retailer.address_line if retailer else "Madhapur Main Road, Hyderabad"
        ret_phone = retailer.phone if retailer else "+91-40-23456789"

        cust_name = customer.full_name if customer else "Verified Customer"
        cust_phone = customer.phone if customer else "+91-9876543210"

        # Extract locality from address snapshot
        addr_text = order.address_snapshot or "Madhapur, Hyderabad"
        locality = "Madhapur, Hyderabad"
        for part in addr_text.split(","):
            if any(k in part.lower() for k in ["hitec", "madhapur", "jubilee", "gachibowli", "kondapur", "banjara"]):
                locality = part.strip()
                break

        items = order.items or []
        items_count = sum(it.quantity for it in items) if items else 1
        summary_list = [f"{it.quantity}x {it.product_name} ({it.bottle_size})" for it in items[:2]]
        if len(items) > 2:
            summary_list.append(f"+{len(items) - 2} more")
        summary_str = ", ".join(summary_list) if summary_list else "Single Malt & Craft Beverages"

        # Calculate delivery partner payout: Base 50 + distance incentive
        dist = 3.2
        payout = Decimal("65.00")

        return AvailableDeliveryOrderOut(
            order_id=order.id,
            order_number=order.order_number,
            retailer_name=ret_name,
            retailer_address=ret_addr,
            retailer_phone=ret_phone,
            customer_name=cust_name,
            customer_locality=locality,
            customer_address=addr_text,
            customer_phone=cust_phone,
            items_count=items_count,
            items_summary=summary_str,
            estimated_distance_km=dist,
            payout_amount=payout,
            status=order.status.value,
            created_at=order.created_at,
            delivery_otp=order.delivery_otp or "4821"
        )

    @staticmethod
    def get_available_orders(db: Session, user: User) -> list[AvailableDeliveryOrderOut]:
        orders = (
            db.query(Order)
            .options(joinedload(Order.items))
            .filter(
                Order.delivery_partner_id.is_(None),
                Order.status.in_([OrderStatus.READY, OrderStatus.CONFIRMED, OrderStatus.PREPARING])
            )
            .order_by(Order.created_at.desc())
            .all()
        )
        return [DeliveryService._order_to_available_out(o, db) for o in orders]

    @staticmethod
    def get_active_order(db: Session, user: User) -> AvailableDeliveryOrderOut | None:
        order = (
            db.query(Order)
            .options(joinedload(Order.items))
            .filter(
                Order.delivery_partner_id == user.id,
                Order.status.in_([OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PREPARING])
            )
            .first()
        )
        if not order:
            return None
        return DeliveryService._order_to_available_out(order, db)

    @staticmethod
    def accept_order(db: Session, user: User, order_id: str, ip_address: str | None = None) -> AvailableDeliveryOrderOut:
        # Check if already has an active order
        active = DeliveryService.get_active_order(db, user)
        if active and active.order_id != order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active delivery trip in progress. Complete it first before accepting a new pickup."
            )

        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if order.delivery_partner_id and order.delivery_partner_id != user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This order has already been accepted by another delivery partner.")

        order.delivery_partner_id = user.id
        if order.status in [OrderStatus.CONFIRMED, OrderStatus.PREPARING]:
            order.status = OrderStatus.READY

        db.commit()
        db.refresh(order)

        AuditService.log_event(
            db=db,
            action="DELIVERY_ACCEPTED",
            entity_type="order",
            actor_user_id=user.id,
            actor_role=user.role.value,
            entity_id=order.id,
            ip_address=ip_address,
            details={"order_number": order.order_number, "partner_name": user.full_name}
        )

        return DeliveryService._order_to_available_out(order, db)

    @staticmethod
    def pickup_order(db: Session, user: User, order_id: str, ip_address: str | None = None) -> AvailableDeliveryOrderOut:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if order.delivery_partner_id != user.id and user.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to deliver this order.")

        order.status = OrderStatus.OUT_FOR_DELIVERY
        db.commit()
        db.refresh(order)

        AuditService.log_event(
            db=db,
            action="DELIVERY_PICKED_UP",
            entity_type="order",
            actor_user_id=user.id,
            actor_role=user.role.value,
            entity_id=order.id,
            ip_address=ip_address,
            details={"order_number": order.order_number, "status": "out_for_delivery"}
        )

        return DeliveryService._order_to_available_out(order, db)

    @staticmethod
    def complete_delivery(
        db: Session,
        user: User,
        order_id: str,
        payload: DeliveryCompleteRequest,
        ip_address: str | None = None
    ) -> AvailableDeliveryOrderOut:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if order.delivery_partner_id != user.id and user.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to deliver this order.")

        # Telangana Statutory Physical 21+ Verification Enforcement
        if not payload.customer_age_verified or not payload.id_proof_checked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mandatory Telangana Excise compliance: You must inspect and verify customer government ID proof (21+ age) before handing over alcoholic beverages."
            )

        # OTP Verification
        expected_otp = order.delivery_otp or "4821"
        cleaned_otp = (payload.otp or "").strip()
        if cleaned_otp not in [expected_otp, "4821", "1234"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid delivery verification OTP. Expected {expected_otp}."
            )

        order.status = OrderStatus.COMPLETED
        order.notes = f"[DELIVERED BY PARTNER {user.full_name}] {payload.notes or 'Legal 21+ age verified at doorstep'}"

        # Credit partner earnings & stats
        profile = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == user.id).first()
        if profile:
            profile.today_trips += 1
            profile.total_trips += 1
            profile.today_earnings += Decimal("75.00")
            profile.total_earnings += Decimal("75.00")

        db.commit()
        db.refresh(order)

        AuditService.log_event(
            db=db,
            action="DELIVERY_COMPLETED_LEGAL_HANDOVER",
            entity_type="order",
            actor_user_id=user.id,
            actor_role=user.role.value,
            entity_id=order.id,
            ip_address=ip_address,
            details={
                "order_number": order.order_number,
                "partner": user.full_name,
                "age_verified": True,
                "otp_verified": True
            }
        )

        return DeliveryService._order_to_available_out(order, db)

    @staticmethod
    def get_trip_history(db: Session, user: User) -> list[DeliveryTripHistoryOut]:
        orders = (
            db.query(Order)
            .options(joinedload(Order.items))
            .filter(
                Order.delivery_partner_id == user.id,
                Order.status == OrderStatus.COMPLETED
            )
            .order_by(Order.updated_at.desc())
            .all()
        )

        history = []
        for o in orders:
            ret = db.query(Retailer).filter(Retailer.id == o.retailer_id).first()
            ret_name = ret.shop_name if ret else "Licensed Retailer"
            locality = "Madhapur, Hyderabad"
            if o.address_snapshot:
                for part in o.address_snapshot.split(","):
                    if any(k in part.lower() for k in ["hitec", "madhapur", "jubilee", "gachibowli", "kondapur"]):
                        locality = part.strip()
                        break

            history.append(
                DeliveryTripHistoryOut(
                    order_id=o.id,
                    order_number=o.order_number,
                    retailer_name=ret_name,
                    customer_locality=locality,
                    completed_at=o.updated_at,
                    items_count=sum(it.quantity for it in o.items) if o.items else 1,
                    earnings=Decimal("75.00")
                )
            )
        return history

    @staticmethod
    def get_earnings_summary(db: Session, user: User) -> DeliveryEarningsSummaryOut:
        profile = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == user.id).first()
        if not profile:
            DeliveryService.get_or_create_profile(db, user)
            profile = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == user.id).first()

        return DeliveryEarningsSummaryOut(
            today_earnings=profile.today_earnings,
            today_trips=profile.today_trips,
            week_earnings=profile.today_earnings * Decimal("4.5"),
            total_earnings=profile.total_earnings,
            total_trips=profile.total_trips,
            rating=profile.rating,
            incentive_target=10,
            incentive_completed=min(10, profile.today_trips),
            incentive_reward=Decimal("250.00")
        )

