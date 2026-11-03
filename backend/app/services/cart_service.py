from decimal import Decimal

from app.models.order import Cart, CartItem
from app.models.product import Inventory, Product
from app.models.retailer import Retailer, RetailerStatus
from app.models.user import User, UserRole
from app.schemas.cart import CartItemAdd, CartItemOut, CartOut
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload


class CartService:
    @staticmethod
    def get_or_create_cart(db: Session, user: User) -> Cart:
        if user.role != UserRole.CUSTOMER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shopping cart reservations are available for customer accounts only."
            )
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if not cart:
            cart = Cart(user_id=user.id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    @staticmethod
    def get_cart_view(db: Session, user: User) -> CartOut:
        """
        Retrieves the user's active cart view.
        Uses eager joinedload to eliminate N+1 query overhead in a single SQL operation.
        """
        cart = CartService.get_or_create_cart(db, user)
        items = (
            db.query(CartItem)
            .options(
                joinedload(CartItem.inventory).joinedload(Inventory.retailer),
                joinedload(CartItem.inventory).joinedload(Inventory.product).joinedload(Product.images),
            )
            .filter(CartItem.cart_id == cart.id)
            .all()
        )

        item_outs = []
        subtotal = Decimal("0.00")
        total_items_count = 0

        for item in items:
            inv = item.inventory
            if not inv:
                continue

            product = inv.product
            retailer = inv.retailer
            if not product or not retailer:
                continue

            primary_img = next(
                (img for img in product.images if img.is_primary),
                product.images[0] if product.images else None
            )

            item_total = inv.price * item.quantity
            subtotal += item_total
            total_items_count += item.quantity

            item_outs.append(
                CartItemOut(
                    id=item.id,
                    inventory_id=inv.id,
                    product_id=product.id,
                    product_name=product.name,
                    brand=product.brand,
                    bottle_size=inv.bottle_size,
                    unit_price=inv.price,
                    quantity=item.quantity,
                    total_price=item_total,
                    image_url=primary_img.image_url if primary_img else "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80",
                    retailer_id=retailer.id,
                    retailer_name=retailer.shop_name,
                    is_available=(inv.is_available and inv.stock_quantity >= item.quantity and retailer.status == RetailerStatus.APPROVED)
                )
            )

        taxes = Decimal("0.00")
        delivery_fee = Decimal("0.00")
        total_amount = subtotal + taxes + delivery_fee

        return CartOut(
            id=cart.id,
            user_id=user.id,
            items=item_outs,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            taxes=taxes,
            total_amount=total_amount,
            item_count=total_items_count,
            is_demo_cart=True
        )

    @staticmethod
    def add_item_to_cart(db: Session, user: User, item_in: CartItemAdd) -> CartOut:
        cart = CartService.get_or_create_cart(db, user)

        # Validate inventory
        inv = db.query(Inventory).filter(Inventory.id == item_in.inventory_id).first()
        if not inv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory listing not found")

        retailer = db.query(Retailer).filter(Retailer.id == inv.retailer_id).first()
        if not retailer or retailer.status != RetailerStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Products can only be selected from licensed and verified retailers"
            )

        if not inv.is_available or inv.stock_quantity < item_in.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity ({item_in.quantity}) exceeds available stock ({inv.stock_quantity})"
            )

        # Check existing item
        existing_item = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.inventory_id == inv.id
        ).first()

        if existing_item:
            new_qty = existing_item.quantity + item_in.quantity
            if new_qty > inv.stock_quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot add more. Total in cart ({new_qty}) exceeds stock ({inv.stock_quantity})"
                )
            existing_item.quantity = new_qty
            existing_item.unit_price = inv.price
        else:
            new_item = CartItem(
                cart_id=cart.id,
                inventory_id=inv.id,
                quantity=item_in.quantity,
                unit_price=inv.price
            )
            db.add(new_item)

        db.commit()
        return CartService.get_cart_view(db, user)

    @staticmethod
    def update_item_quantity(db: Session, user: User, item_id: str, quantity: int) -> CartOut:
        cart = CartService.get_or_create_cart(db, user)
        item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in customer cart")

        if quantity <= 0:
            db.delete(item)
            db.commit()
            return CartService.get_cart_view(db, user)

        inv = db.query(Inventory).filter(Inventory.id == item.inventory_id).first()
        if not inv or inv.stock_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requested quantity exceeds currently available stock"
            )

        item.quantity = quantity
        item.unit_price = inv.price
        db.commit()
        return CartService.get_cart_view(db, user)

    @staticmethod
    def remove_item(db: Session, user: User, item_id: str) -> CartOut:
        cart = CartService.get_or_create_cart(db, user)
        item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in customer cart")

        db.delete(item)
        db.commit()
        return CartService.get_cart_view(db, user)

    @staticmethod
    def clear_cart(db: Session, user: User) -> None:
        cart = CartService.get_or_create_cart(db, user)
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
