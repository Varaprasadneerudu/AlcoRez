import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app.core.compliance import ComplianceEngine
from app.models.order import (
    Cart,
    CartItem,
    Order,
    OrderItem,
    OrderStatus,
    PaymentAttempt,
)
from app.models.product import Inventory, InventoryMovement, Product
from app.models.retailer import Retailer, RetailerMembership
from app.models.user import Address, User
from app.schemas.order import (
    OrderItemOut,
    OrderOut,
    OrderStatusUpdate,
    SimulatedCheckoutRequest,
)
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

VALID_ORDER_TRANSITIONS = {
    OrderStatus.CREATED: [OrderStatus.CONFIRMED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED, OrderStatus.FAILED],
    OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.COMPLETED, OrderStatus.FAILED, OrderStatus.CANCELLED],
    OrderStatus.COMPLETED: [],
    OrderStatus.REJECTED: [],
    OrderStatus.CANCELLED: [],
    OrderStatus.FAILED: [],
}

class OrderService:
    @staticmethod
    def create_simulated_order(
        db: Session,
        user: User,
        checkout_in: SimulatedCheckoutRequest,
        ip_address: str | None = None
    ) -> list[OrderOut]:
        """
        Creates simulated test orders from customer's cart.
        Partitions cart items by retailer, snapshots item details, decrements mock stock,
        and records a simulated payment attempt.
        """
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if not cart:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active cart found")

        cart_items = db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
        if not cart_items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

        # Resolve address snapshot
        address_snapshot_str = "Customer In-Store Pickup Demonstration"
        if checkout_in.address_id:
            addr = db.query(Address).filter(Address.id == checkout_in.address_id, Address.user_id == user.id).first()
            if addr:
                address_snapshot_str = f"{addr.label}: {addr.address_line1}, {addr.city}, {addr.state} - {addr.postal_code}"

        # Group items by retailer
        items_by_retailer = {}
        for c_item in cart_items:
            inv = db.query(Inventory).filter(Inventory.id == c_item.inventory_id).with_for_update().first()
            if not inv:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory listing is no longer available")
            if inv.stock_quantity < c_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item {inv.bottle_size} is out of stock (available: {inv.stock_quantity})"
                )
            if inv.retailer_id not in items_by_retailer:
                items_by_retailer[inv.retailer_id] = []
            items_by_retailer[inv.retailer_id].append((c_item, inv))

        created_orders = []

        # Execute order creation in transaction
        try:
            for retailer_id, items_list in items_by_retailer.items():
                order_num = f"SIM-TS-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

                subtotal = Decimal("0.00")
                for c_item, inv in items_list:
                    subtotal += inv.price * c_item.quantity

                order = Order(
                    order_number=order_num,
                    user_id=user.id,
                    retailer_id=retailer_id,
                    status=OrderStatus.CREATED,
                    subtotal=subtotal,
                    delivery_fee=Decimal("0.00"),
                    taxes=Decimal("0.00"),
                    total_amount=subtotal,
                    address_snapshot=address_snapshot_str,
                    is_simulated=True, # Critical compliance flag
                    notes=f"[DEMO SIMULATION] {checkout_in.customer_notes or 'Test checkout only'}"
                )
                db.add(order)
                db.flush()

                # Create OrderItems with snapshot details and decrement inventory
                for c_item, inv in items_list:
                    product = db.query(Product).filter(Product.id == inv.product_id).first()
                    order_item = OrderItem(
                        order_id=order.id,
                        inventory_id=inv.id,
                        product_name=product.name,
                        brand=product.brand,
                        bottle_size=inv.bottle_size,
                        unit_price=inv.price,
                        quantity=c_item.quantity,
                        total_price=inv.price * c_item.quantity
                    )
                    db.add(order_item)
                    # Stock is held and will be automatically decremented upon retailer accepting/confirming the order

                # Create simulated payment record
                payment_ref = f"SIM-PAY-{uuid.uuid4().hex[:8].upper()}"
                payment = PaymentAttempt(
                    order_id=order.id,
                    provider="SIMULATED_TEST_GATEWAY",
                    transaction_reference=payment_ref,
                    amount=subtotal,
                    currency="INR",
                    status="SUCCESS" if checkout_in.simulate_payment_success else "FAILED",
                    gateway_response="Simulated approval response. No live financial transaction executed.",
                    is_simulated=True
                )
                db.add(payment)

                AuditService.log_event(
                    db=db,
                    action="SIMULATED_ORDER_CREATED",
                    entity_type="order",
                    actor_user_id=user.id,
                    actor_role=user.role.value,
                    entity_id=order.id,
                    ip_address=ip_address,
                    details={"order_number": order.order_number, "total_amount": str(subtotal), "simulated": True}
                )

                created_orders.append(order)

            # Clear cart after checkout
            db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
            db.commit()

            # Send order confirmation notifications to customer and retailer
            ret_ids = list({ord_obj.retailer_id for ord_obj in created_orders if ord_obj.retailer_id})
            ret_map = {r.id: r for r in db.query(Retailer).filter(Retailer.id.in_(ret_ids)).all()} if ret_ids else {}
            for ord_obj in created_orders:
                try:
                    ret_obj = ret_map.get(ord_obj.retailer_id)
                    NotificationService.notify_order_created(db, ord_obj, ret_obj, user)
                except Exception as notif_err:
                    print(f"Failed to create order notification: {notif_err}")

            return OrderService.to_order_out_batch(db, created_orders)

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Order checkout failed: {e!s}") from e

    @staticmethod
    def get_order_by_id(db: Session, order_id: str, requesting_user: User) -> OrderOut:
        order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # Isolation checks:
        # Customer can only view own order
        if requesting_user.role.value == "customer" and order.user_id != requesting_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to this order is forbidden")

        # Retailer can only view orders assigned to their store
        if requesting_user.role.value == "retailer":
            retailer = db.query(Retailer).filter(Retailer.user_id == requesting_user.id).first()
            if not retailer:
                membership = db.query(RetailerMembership).filter(RetailerMembership.user_id == requesting_user.id).first()
                if membership:
                    retailer = db.query(Retailer).filter(Retailer.id == membership.retailer_id).first()
            if not retailer or order.retailer_id != retailer.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to other retailers' orders is forbidden")

        return OrderService.to_order_out(db, order)

    @staticmethod
    def get_customer_orders(db: Session, user: User) -> list[OrderOut]:
        query = db.query(Order).options(joinedload(Order.items))
        if user.role.value != "admin":
            query = query.filter(Order.user_id == user.id)
        orders = query.order_by(Order.created_at.desc()).all()
        return OrderService.to_order_out_batch(db, orders)

    @staticmethod
    def get_retailer_orders(db: Session, retailer_id: str) -> list[OrderOut]:
        orders = (
            db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.retailer_id == retailer_id)
            .order_by(Order.created_at.desc())
            .all()
        )
        return OrderService.to_order_out_batch(db, orders)

    @staticmethod
    def update_order_status(
        db: Session,
        order_id: str,
        status_in: OrderStatusUpdate,
        actor_user: User,
        ip_address: str | None = None
    ) -> OrderOut:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # Permissions: Only assigned retailer or admin can update status
        if actor_user.role.value == "retailer":
            retailer = db.query(Retailer).filter(Retailer.user_id == actor_user.id).first()
            if not retailer:
                membership = db.query(RetailerMembership).filter(RetailerMembership.user_id == actor_user.id).first()
                if membership:
                    retailer = db.query(Retailer).filter(Retailer.id == membership.retailer_id).first()
            if not retailer or order.retailer_id != retailer.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot alter another retailer's order")

        # Validate status state machine
        current_status: OrderStatus = OrderStatus(order.status)
        allowed_transitions = VALID_ORDER_TRANSITIONS.get(current_status, [])
        if status_in.status not in allowed_transitions and actor_user.role.value != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid order transition from {current_status.value} to {status_in.status.value}"
            )

        # Enforce statutory compliance: Live delivery dispatch prohibited
        if status_in.status == OrderStatus.COMPLETED and not order.is_simulated:
            ComplianceEngine.assert_alcohol_dispatch_allowed()

        # Automatic Inventory Stock Management upon Accepting Order (status -> CONFIRMED)
        if status_in.status in [OrderStatus.CONFIRMED, OrderStatus.COMPLETED] and current_status == OrderStatus.CREATED:
            for item in order.items:
                if item.inventory_id:
                    inv = db.query(Inventory).filter(Inventory.id == item.inventory_id).with_for_update().first()
                    if inv:
                        if inv.stock_quantity < item.quantity:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Insufficient inventory stock to accept order. Product: {item.product_name} ({item.bottle_size}), Available: {inv.stock_quantity}, Required: {item.quantity}."
                            )
                        old_qty = inv.stock_quantity
                        new_qty = old_qty - item.quantity
                        inv.stock_quantity = new_qty
                        inv.version = inv.version + 1

                        movement = InventoryMovement(
                            inventory_id=inv.id,
                            retailer_id=order.retailer_id,
                            previous_quantity=old_qty,
                            new_quantity=new_qty,
                            change_quantity=-item.quantity,
                            reason="ORDER_FULFILLMENT",
                            notes=f"Stock automatically decreased upon accepting order #{order.order_number}",
                            actor_user_id=actor_user.id,
                            actor_name=actor_user.full_name,
                            actor_role=actor_user.role.value
                        )
                        db.add(movement)

        # Automatic Inventory Stock Restoration if an accepted order is cancelled or rejected
        elif status_in.status in [OrderStatus.CANCELLED, OrderStatus.REJECTED] and current_status in [
            OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY
        ]:
            for item in order.items:
                if item.inventory_id:
                    inv = db.query(Inventory).filter(Inventory.id == item.inventory_id).with_for_update().first()
                    if inv:
                        old_qty = inv.stock_quantity
                        new_qty = old_qty + item.quantity
                        inv.stock_quantity = new_qty
                        inv.version = inv.version + 1

                        movement = InventoryMovement(
                            inventory_id=inv.id,
                            retailer_id=order.retailer_id,
                            previous_quantity=old_qty,
                            new_quantity=new_qty,
                            change_quantity=item.quantity,
                            reason="ORDER_CANCELLED_RESTOCK",
                            notes=f"Stock automatically restored due to order cancellation #{order.order_number}",
                            actor_user_id=actor_user.id,
                            actor_name=actor_user.full_name,
                            actor_role=actor_user.role.value
                        )
                        db.add(movement)

        order.status = status_in.status
        if status_in.notes:
            order.notes = f"{order.notes or ''} | {status_in.notes}"
        db.commit()
        db.refresh(order)

        AuditService.log_event(
            db=db,
            action="ORDER_STATUS_UPDATED",
            entity_type="order",
            actor_user_id=actor_user.id,
            actor_role=actor_user.role.value,
            entity_id=order.id,
            ip_address=ip_address,
            details={"previous_status": current_status.value, "new_status": status_in.status.value}
        )

        # Notify customer of order status transition
        try:
            NotificationService.notify_order_status(db, order, current_status, status_in.status)
            # If customer performed the action (e.g. cancelled), notify retailer as well
            if actor_user.id == order.user_id:
                ret_obj = db.query(Retailer).filter(Retailer.id == order.retailer_id).first()
                if ret_obj and ret_obj.user_id:
                    NotificationService.create_notification(
                        db=db,
                        user_id=ret_obj.user_id,
                        title=f"Order Cancelled by Customer: #{order.order_number}",
                        message=f"Customer {actor_user.full_name or 'Customer'} cancelled reservation #{order.order_number}.",
                        notification_type="ORDER_UPDATE"
                    )
        except Exception as notif_err:
            print(f"Failed to create order status update notification: {notif_err}")

        return OrderService.to_order_out(db, order)

    @staticmethod
    def to_order_out_batch(db: Session, orders: list[Order]) -> list[OrderOut]:
        if not orders:
            return []

        order_ids = [str(o.id) for o in orders]
        retailer_ids = list({str(o.retailer_id) for o in orders if o.retailer_id})

        retailer_map: dict[str, str] = {}
        if retailer_ids:
            retailers = db.query(Retailer.id, Retailer.shop_name).filter(Retailer.id.in_(retailer_ids)).all()
            retailer_map = {str(r.id): str(r.shop_name) for r in retailers}

        payment_map: dict[str, str] = {}
        if order_ids:
            payments = db.query(PaymentAttempt).filter(PaymentAttempt.order_id.in_(order_ids)).all()
            for p in payments:
                pid = str(p.order_id)
                if pid not in payment_map:
                    payment_map[pid] = str(p.status)

        delivery_partner_ids = [str(o.delivery_partner_id) for o in orders if getattr(o, "delivery_partner_id", None)]
        partner_map: dict[str, str] = {}
        if delivery_partner_ids:
            partners = db.query(User.id, User.full_name).filter(User.id.in_(delivery_partner_ids)).all()
            partner_map = {str(p.id): str(p.full_name) for p in partners}

        results = []
        for order in orders:
            item_outs = [
                OrderItemOut(
                    id=item.id,
                    product_name=item.product_name,
                    brand=item.brand,
                    bottle_size=item.bottle_size,
                    unit_price=item.unit_price,
                    quantity=item.quantity,
                    total_price=item.total_price
                )
                for item in (order.items or [])
            ]
            r_name = retailer_map.get(str(order.retailer_id), "Unknown Shop")
            p_status = payment_map.get(str(order.id), "SIMULATED")
            dp_id = getattr(order, "delivery_partner_id", None)
            dp_name = partner_map.get(str(dp_id)) if dp_id else None
            dp_otp = getattr(order, "delivery_otp", None)

            results.append(
                OrderOut(
                    id=order.id,
                    order_number=order.order_number,
                    user_id=order.user_id,
                    retailer_id=order.retailer_id,
                    retailer_name=r_name,
                    status=order.status,
                    subtotal=order.subtotal,
                    delivery_fee=order.delivery_fee,
                    taxes=order.taxes,
                    total_amount=order.total_amount,
                    address_snapshot=order.address_snapshot,
                    is_simulated=order.is_simulated,
                    notes=order.notes,
                    created_at=order.created_at,
                    updated_at=order.updated_at,
                    items=item_outs,
                    payment_status=p_status,
                    delivery_partner_id=dp_id,
                    delivery_partner_name=dp_name,
                    delivery_otp=dp_otp
                )
            )
        return results

    @staticmethod
    def to_order_out(db: Session, order: Order) -> OrderOut:
        batch = OrderService.to_order_out_batch(db, [order])
        return batch[0]
