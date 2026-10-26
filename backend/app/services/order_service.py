import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.compliance import ComplianceEngine
from app.models.order import Order, OrderItem, OrderStatus, PaymentAttempt, Cart, CartItem
from app.models.product import Inventory, Product, InventoryMovement
from app.models.retailer import Retailer, RetailerMembership
from app.models.user import User, Address
from app.schemas.order import SimulatedCheckoutRequest, OrderOut, OrderItemOut, OrderStatusUpdate
from app.services.audit_service import AuditService

VALID_ORDER_TRANSITIONS = {
    OrderStatus.CREATED: [OrderStatus.CONFIRMED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
    OrderStatus.CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.COMPLETED, OrderStatus.FAILED],
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
        ip_address: Optional[str] = None
    ) -> List[OrderOut]:
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
                retailer = db.query(Retailer).filter(Retailer.id == retailer_id).first()
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

            # Prepare responses
            results = []
            for ord_obj in created_orders:
                results.append(OrderService.to_order_out(db, ord_obj))
            return results

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Order checkout failed: {str(e)}")

    @staticmethod
    def get_order_by_id(db: Session, order_id: str, requesting_user: User) -> OrderOut:
        order = db.query(Order).filter(Order.id == order_id).first()
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
    def get_customer_orders(db: Session, user: User) -> List[OrderOut]:
        orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
        return [OrderService.to_order_out(db, o) for o in orders]

    @staticmethod
    def get_retailer_orders(db: Session, retailer_id: str) -> List[OrderOut]:
        orders = db.query(Order).filter(Order.retailer_id == retailer_id).order_by(Order.created_at.desc()).all()
        return [OrderService.to_order_out(db, o) for o in orders]

    @staticmethod
    def update_order_status(
        db: Session,
        order_id: str,
        status_in: OrderStatusUpdate,
        actor_user: User,
        ip_address: Optional[str] = None
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

        return OrderService.to_order_out(db, order)

    @staticmethod
    def to_order_out(db: Session, order: Order) -> OrderOut:
        retailer = db.query(Retailer).filter(Retailer.id == order.retailer_id).first()
        payment = db.query(PaymentAttempt).filter(PaymentAttempt.order_id == order.id).first()

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
            for item in order.items
        ]

        return OrderOut(
            id=order.id,
            order_number=order.order_number,
            user_id=order.user_id,
            retailer_id=order.retailer_id,
            retailer_name=retailer.shop_name if retailer else "Unknown Shop",
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
            payment_status=payment.status if payment else "SIMULATED"
        )
