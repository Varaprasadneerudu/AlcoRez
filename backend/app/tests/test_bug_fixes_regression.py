import csv
import io
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
from app.models.compliance import Notification
from app.models.order import Cart, CartItem, Order, OrderItem, OrderStatus
from app.models.product import Category, Inventory, InventoryMovement, Product
from app.models.retailer import (
    Retailer,
    RetailerInvitation,
    RetailerLicense,
    RetailerMembership,
    RetailerStatus,
)
from app.models.user import Address, CustomerProfile, RefreshToken, User, UserRole
from app.tests.conftest import TestSessionLocal
from sqlalchemy.exc import IntegrityError


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------
def _login(client, email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    token = res.json()["access_token"]
    refresh = res.json()["refresh_token"]
    return {"Authorization": f"Bearer {token}"}, token, refresh


# ---------------------------------------------------------------------------
# Bug 1: Retailer Account Takeover Prevention
# ---------------------------------------------------------------------------
def test_bug_1_retailer_account_takeover_prevention(client):
    # 1. Setup existing approved store owned by retailer
    ret_owner_headers, _, _ = _login(client, "retailer@madhapurwines.mock", "Retailer@123456")
    dash_owner = client.get("/api/v1/retailer/dashboard", headers=ret_owner_headers).json()
    target_store = dash_owner["retailer"]
    target_store_id = target_store["id"]

    # 2. Register an ordinary customer
    attacker_email = f"attacker_{uuid.uuid4().hex[:6]}@demo.mock"
    client.post("/api/v1/auth/register", json={
        "email": attacker_email,
        "password": "Password@123",
        "full_name": "Attacker User",
        "role": "customer",
        "date_of_birth": "1990-01-01"
    })
    attacker_headers, _, _ = _login(client, attacker_email, "Password@123")

    # 3. Attacker attempts to take over target store without invitation -> 403 Forbidden
    takeover_no_invite = client.post("/api/v1/retailer/applications", json={
        "shop_name": "Fictitious Name",
        "trade_name": "Fictitious Trade",
        "contact_person": "Attacker",
        "phone": "+91-9999999999",
        "email": attacker_email,
        "address_line": "123 Fake Street",
        "postal_code": "500081",
        "license_number": f"2B-MOCK-{uuid.uuid4().hex[:4]}",
        "license_type": "2B",
        "issuing_authority": "Excise Dept",
        "issued_date": "2024-01-01",
        "expiry_date": "2027-01-01",
        "existing_retailer_id": target_store_id
    }, headers=attacker_headers)
    assert takeover_no_invite.status_code == 403
    assert "invitation code is required" in takeover_no_invite.json()["detail"].lower()

    # 4. Attacker attempts with invalid invitation code -> 403 Forbidden
    takeover_bad_code = client.post("/api/v1/retailer/applications", json={
        "shop_name": "Fictitious Name",
        "trade_name": "Fictitious Trade",
        "contact_person": "Attacker",
        "phone": "+91-9999999999",
        "email": attacker_email,
        "address_line": "123 Fake Street",
        "postal_code": "500081",
        "license_number": f"2B-MOCK-{uuid.uuid4().hex[:4]}",
        "license_type": "2B",
        "issuing_authority": "Excise Dept",
        "issued_date": "2024-01-01",
        "expiry_date": "2027-01-01",
        "existing_retailer_id": target_store_id,
        "invitation_code": "INV-INVALIDCODE"
    }, headers=attacker_headers)
    assert takeover_bad_code.status_code == 403

    # 5. Attacker tries to access target store dashboard directly -> 403 Forbidden
    dash_attempt = client.get("/api/v1/retailer/dashboard", headers=attacker_headers)
    assert dash_attempt.status_code == 403

    # 6. Store owner issues a genuine invitation code
    ret_headers, _, _ = _login(client, "retailer@madhapurwines.mock", "Retailer@123456")
    inv_res = client.post("/api/v1/retailer/invitations", json={
        "invited_email": attacker_email,
        "role_in_retailer": "STAFF",
        "expires_in_days": 7
    }, headers=ret_headers)
    assert inv_res.status_code == 201
    valid_invite_code = inv_res.json()["code"]

    # 7. With valid invitation code, joining succeeds
    join_res = client.post("/api/v1/retailer/applications", json={
        "shop_name": target_store["shop_name"],
        "trade_name": target_store["trade_name"],
        "contact_person": "Attacker Joined",
        "phone": "+91-9999999999",
        "email": attacker_email,
        "address_line": "123 Joined",
        "postal_code": "500081",
        "license_number": f"2B-MOCK-{uuid.uuid4().hex[:4]}",
        "license_type": "2B",
        "issuing_authority": "Excise Dept",
        "issued_date": "2024-01-01",
        "expiry_date": "2027-01-01",
        "existing_retailer_id": target_store_id,
        "invitation_code": valid_invite_code
    }, headers=attacker_headers)
    assert join_res.status_code == 201
    assert join_res.json()["id"] == target_store_id


# ---------------------------------------------------------------------------
# Bug 2: Age Verification Bypass Prevention
# ---------------------------------------------------------------------------
def test_bug_2_age_verification_bypass_prevention(client):
    # 1. Customer registers WITHOUT date of birth (unverified)
    email = f"unverified_{uuid.uuid4().hex[:6]}@demo.mock"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password@123",
        "full_name": "Unverified Customer",
        "role": "customer"
    })
    assert reg_res.status_code == 201
    assert reg_res.json()["is_verified"] is False

    headers, _, _ = _login(client, email, "Password@123")

    # 2. Product discovery remains fully accessible for unverified customer
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    assert cat_res.status_code == 200
    p_id = cat_res.json()["items"][0]["id"]
    p_detail = client.get(f"/api/v1/products/{p_id}").json()
    inv_id = p_detail["inventories"][0]["id"]

    # 3. Add to cart works
    add_res = client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=headers)
    assert add_res.status_code == 201

    # 4. Attempt simulated checkout -> 403 Forbidden because customer is unverified
    checkout_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=headers)
    assert checkout_res.status_code == 403
    assert "21+" in checkout_res.json()["detail"] or "age verification" in checkout_res.json()["detail"].lower()

    # 5. Customer attempts underage verification (< 21) -> 400 Bad Request
    underage_res = client.post("/api/v1/customer/verify-age", json={
        "date_of_birth": "2015-01-01"
    }, headers=headers)
    assert underage_res.status_code == 400

    # 6. Customer verifies legal 21+ age -> 200 OK
    verify_res = client.post("/api/v1/customer/verify-age", json={
        "date_of_birth": "1998-05-10",
        "id_proof_type": "Aadhaar",
        "id_proof_number": "XXXX-XXXX-9999"
    }, headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["age_verified"] is True

    # 7. Now simulated checkout succeeds!
    checkout_success = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=headers)
    assert checkout_success.status_code == 201


# ---------------------------------------------------------------------------
# Bug 3: Predictable Delivery OTP Rejected
# ---------------------------------------------------------------------------
def test_bug_3_predictable_delivery_otp_rejected(client):
    cust_headers, _, _ = _login(client, "customer@demo.com", "Customer@123456")
    ret_headers, _, _ = _login(client, "retailer@madhapurwines.mock", "Retailer@123456")
    dp_headers, _, _ = _login(client, "partner@demo.com", "Partner@123456")

    client.delete("/api/v1/cart", headers=cust_headers)
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    inv_id = cat_res.json()["items"][0]["inventories"][0]["id"]
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)

    order_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert order_res.status_code == 201
    order = order_res.json()[0]
    order_id = order["id"]
    actual_otp = order["delivery_otp"]
    calculated_code = str(abs(sum(ord(c) for c in order["order_number"]) or 4892) % 9000 + 1000)

    # Progress order to OUT_FOR_DELIVERY
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "ready"}, headers=ret_headers)
    client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)

    # Calculated legacy code MUST NOT complete a new order
    if calculated_code != actual_otp:
        bad_res = client.post(
            f"/api/v1/delivery/orders/{order_id}/complete",
            json={"customer_age_verified": True, "id_proof_checked": True, "otp": calculated_code},
            headers=dp_headers
        )
        assert bad_res.status_code == 400
        assert bad_res.json()["detail"] == "Invalid delivery verification OTP."

    # Actual random OTP completes successfully
    good_res = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={"customer_age_verified": True, "id_proof_checked": True, "otp": actual_otp},
        headers=dp_headers
    )
    assert good_res.status_code == 200
    assert good_res.json()["status"] == "completed"


# ---------------------------------------------------------------------------
# Bug 4: Refresh Token Rotation, Replay, and Logout Revocation
# ---------------------------------------------------------------------------
def test_bug_4_refresh_token_rotation_and_revocation(client):
    # 1. Login user
    email = f"user_tok_{uuid.uuid4().hex[:6]}@demo.mock"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password@123",
        "full_name": "Token Tester",
        "role": "customer",
        "date_of_birth": "1990-01-01"
    })
    _, _, refresh_token_1 = _login(client, email, "Password@123")

    # 2. First refresh rotates the token and succeeds
    ref_res1 = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token_1})
    assert ref_res1.status_code == 200
    refresh_token_2 = ref_res1.json()["refresh_token"]
    assert refresh_token_2 != refresh_token_1

    # 3. Submitting the old refresh_token_1 again (Replay/Reuse attempt) -> 401 Unauthorized
    replay_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token_1})
    assert replay_res.status_code == 401

    # 4. Token replay revokes the entire family, so refresh_token_2 is also revoked
    family_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token_2})
    assert family_res.status_code == 401

    # 5. New login, then logout revokes refresh token
    new_headers, _, new_refresh = _login(client, email, "Password@123")
    logout_res = client.post("/api/v1/auth/logout", json={"refresh_token": new_refresh}, headers=new_headers)
    assert logout_res.status_code == 200

    # Refresh after logout fails
    after_logout = client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh})
    assert after_logout.status_code == 401

    # 6. Inactive user cannot refresh
    _, _, active_refresh = _login(client, email, "Password@123")
    with TestSessionLocal() as session:
        u = session.query(User).filter(User.email == email).first()
        u.is_active = False
        session.commit()

    inactive_res = client.post("/api/v1/auth/refresh", json={"refresh_token": active_refresh})
    assert inactive_res.status_code == 401


# ---------------------------------------------------------------------------
# Bug 5: Failed Simulated Payment Preserves Cart and Creates No Order
# ---------------------------------------------------------------------------
def test_bug_5_failed_simulated_payment_preserves_cart_and_creates_no_order(client):
    cust_headers, _, _ = _login(client, "customer@demo.com", "Customer@123456")

    # Clear cart
    client.delete("/api/v1/cart", headers=cust_headers)

    # Add item to cart
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    inv_id = cat_res.json()["items"][0]["inventories"][0]["id"]
    add_res = client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 2}, headers=cust_headers)
    assert add_res.status_code == 201

    # Capture initial order count for customer
    initial_orders = client.get("/api/v1/orders", headers=cust_headers).json()
    initial_order_count = len(initial_orders)

    # Attempt simulated checkout with simulated payment failure
    fail_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": False}, headers=cust_headers)
    assert fail_res.status_code == 400
    assert "payment authorization failed" in fail_res.json()["detail"].lower()

    # Verify no new orders were created
    current_orders = client.get("/api/v1/orders", headers=cust_headers).json()
    assert len(current_orders) == initial_order_count

    # Verify cart items remain preserved
    cart_res = client.get("/api/v1/cart", headers=cust_headers)
    assert cart_res.status_code == 200
    assert cart_res.json()["item_count"] == 2


# ---------------------------------------------------------------------------
# Bug 6: Cancelling OUT_FOR_DELIVERY Order Restores Stock Idempotently
# ---------------------------------------------------------------------------
def test_bug_6_cancelling_out_for_delivery_restores_stock(client):
    cust_headers, _, _ = _login(client, "customer@demo.com", "Customer@123456")
    ret_headers, _, _ = _login(client, "retailer@madhapurwines.mock", "Retailer@123456")
    dp_headers, _, _ = _login(client, "partner@demo.com", "Partner@123456")

    client.delete("/api/v1/cart", headers=cust_headers)
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    inv_id = cat_res.json()["items"][0]["inventories"][0]["id"]

    with TestSessionLocal() as session:
        initial_inv = session.query(Inventory).filter(Inventory.id == inv_id).first()
        initial_stock = initial_inv.stock_quantity

    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 3}, headers=cust_headers)
    order_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    order_id = order_res.json()[0]["id"]

    # Progress to CONFIRMED (stock decreases by 3)
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)
    with TestSessionLocal() as session:
        assert session.query(Inventory).filter(Inventory.id == inv_id).first().stock_quantity == initial_stock - 3

    # Progress to READY and OUT_FOR_DELIVERY
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "ready"}, headers=ret_headers)
    client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)

    # Cancel order while in OUT_FOR_DELIVERY -> Stock must be restored by 3
    cancel_res = client.patch(
        f"/api/v1/retailer/orders/{order_id}/status",
        json={"status": "cancelled", "notes": "Customer cancelled at doorstep"},
        headers=ret_headers
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    with TestSessionLocal() as session:
        restored_stock = session.query(Inventory).filter(Inventory.id == inv_id).first().stock_quantity
        assert restored_stock == initial_stock
        movement = session.query(InventoryMovement).filter(
            InventoryMovement.inventory_id == inv_id,
            InventoryMovement.reason == "ORDER_CANCELLED_RESTOCK"
        ).order_by(InventoryMovement.created_at.desc()).first()
        assert movement is not None
        assert movement.change_quantity == 3

    # Repeated cancellation request is rejected and does NOT add stock again
    repeat_cancel = client.patch(
        f"/api/v1/retailer/orders/{order_id}/status",
        json={"status": "cancelled"},
        headers=ret_headers
    )
    assert repeat_cancel.status_code == 400

    with TestSessionLocal() as session:
        assert session.query(Inventory).filter(Inventory.id == inv_id).first().stock_quantity == initial_stock


# ---------------------------------------------------------------------------
# Bug 7: Terminal State Order Protection from Admin Transitions
# ---------------------------------------------------------------------------
def test_bug_7_terminal_order_state_protected_from_admin(client):
    admin_headers, _, _ = _login(client, "admin@telanganaliquor.gov.mock", "Admin@123456")
    cust_headers, _, _ = _login(client, "customer@demo.com", "Customer@123456")

    client.delete("/api/v1/cart", headers=cust_headers)
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    inv_id = cat_res.json()["items"][0]["inventories"][0]["id"]
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)
    order = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers).json()[0]
    order_id = order["id"]

    # Cancel order to make it terminal
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "cancelled"}, headers=admin_headers)

    # Admin attempts to reset terminal order back to CREATED or CONFIRMED -> 400 Bad Request
    reset_created = client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "created"}, headers=admin_headers)
    assert reset_created.status_code == 400
    assert "terminal state" in reset_created.json()["detail"].lower()

    reset_confirmed = client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=admin_headers)
    assert reset_confirmed.status_code == 400
    assert "terminal state" in reset_confirmed.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Bug 8: Bulk CSV Import Authorization on Pending and Suspended Shops
# ---------------------------------------------------------------------------
def test_bug_8_bulk_csv_import_authorization_check(client):
    admin_headers, _, _ = _login(client, "admin@telanganaliquor.gov.mock", "Admin@123456")

    # Create a pending retailer
    pending_email = f"pending_ret_{uuid.uuid4().hex[:6]}@demo.mock"
    client.post("/api/v1/admin/users", json={
        "email": pending_email,
        "password": "Password@123",
        "full_name": "Pending Owner",
        "role": "retailer",
        "is_verified": True
    }, headers=admin_headers)
    p_headers, _, _ = _login(client, pending_email, "Password@123")

    client.post("/api/v1/retailer/applications", json={
        "shop_name": f"Pending Shop {uuid.uuid4().hex[:4]}",
        "trade_name": "Pending Trade",
        "contact_person": "Pending Owner",
        "phone": "+91-9123456789",
        "email": pending_email,
        "address_line": "Pending Line",
        "postal_code": "500081",
        "license_number": f"2B-PEND-{uuid.uuid4().hex[:4]}",
        "license_type": "2B",
        "issuing_authority": "Excise Dept",
        "issued_date": "2024-01-01",
        "expiry_date": "2027-01-01"
    }, headers=p_headers)

    sample_csv = "Product Name,Brand,Category,Bottle Size,Price,Stock Quantity,Available,Low Stock Threshold\nTest Whisky,Test Brand,Whisky,750ml,1500,20,TRUE,5"

    # Pending retailer cannot preview CSV -> 403 Forbidden
    preview_res = client.post("/api/v1/retailer/inventory/import/preview", json={"raw_csv": sample_csv}, headers=p_headers)
    assert preview_res.status_code == 403
    assert "approved" in preview_res.json()["detail"].lower()

    # Pending retailer cannot apply import -> 403 Forbidden
    apply_res = client.post("/api/v1/retailer/inventory/import/apply", json={"items": [{
        "product_name": "Test Whisky",
        "brand": "Test Brand",
        "category": "Whisky",
        "bottle_size": "750ml",
        "price": 1500.0,
        "stock_quantity": 20,
        "is_available": True,
        "low_stock_threshold": 5
    }]}, headers=p_headers)
    assert apply_res.status_code == 403


# ---------------------------------------------------------------------------
# Bug 9: Bulk Import Atomicity (Rolls Back on Error Without Partial Low-Stock Notifications)
# ---------------------------------------------------------------------------
def test_bug_9_bulk_import_atomicity_rolls_back(client):
    ret_headers, _, _ = _login(client, "retailer@madhapurwines.mock", "Retailer@123456")

    # Get retailer user id to check notifications
    with TestSessionLocal() as session:
        u = session.query(User).filter(User.email == "retailer@madhapurwines.mock").first()
        r_user_id = u.id
        initial_notif_count = session.query(Notification).filter(Notification.user_id == r_user_id).count()

    unique_prod_name = f"Atomic Spirits {uuid.uuid4().hex[:6]}"

    # Row 1: Low-stock item (triggers low-stock alert)
    # Row 2: Invalid item causing an error (e.g. Price <= 0 or Database Integrity constraint)
    # Using apply_inventory_csv with an item that causes an unhandled error inside loop
    from app.services.retailer_service import RetailerService
    from app.schemas.catalog import InventoryCsvRowPreview

    row1 = InventoryCsvRowPreview(
        row_number=1,
        product_name=unique_prod_name,
        brand="Atomic Brand",
        category="Whisky",
        bottle_size="750ml",
        price=Decimal("1200.00"),
        stock_quantity=2, # <= low stock threshold (5)
        is_available=True,
        low_stock_threshold=5,
        action="NEW PRODUCT",
        status="VALID",
        is_valid=True
    )
    # Faulty row with None as price causing a DB NOT NULL integrity error on flush
    row2 = InventoryCsvRowPreview(
        row_number=2,
        product_name="Failing Product",
        brand="Failing Brand",
        category="Whisky",
        bottle_size="750ml",
        price=None, # Non-nullable column in Inventory schema!
        stock_quantity=10,
        is_available=True,
        low_stock_threshold=5,
        action="NEW PRODUCT",
        status="VALID",
        is_valid=True
    )

    with TestSessionLocal() as session:
        retailer = session.query(Retailer).filter(Retailer.user_id == r_user_id).first()
        actor = session.query(User).filter(User.id == r_user_id).first()
        with pytest.raises(Exception):
            RetailerService.apply_inventory_csv(session, retailer, actor, [row1, row2])

    # Verify that atomicity holds: row 1 was rolled back and NO notification was committed
    with TestSessionLocal() as session:
        assert session.query(Product).filter(Product.name == unique_prod_name).first() is None
        after_notifs = session.query(Notification).filter(Notification.user_id == r_user_id).count()
        assert after_notifs == initial_notif_count


# ---------------------------------------------------------------------------
# Bug 10: Retailer License Validity Across Catalog, Cart, and Checkout
# ---------------------------------------------------------------------------
def test_bug_10_retailer_license_validity_enforced(client):
    admin_headers, _, _ = _login(client, "admin@telanganaliquor.gov.mock", "Admin@123456")
    cust_headers, _, _ = _login(client, "customer@demo.com", "Customer@123456")

    # 1. Create a store with EXPIRED license
    exp_email = f"expired_ret_{uuid.uuid4().hex[:6]}@demo.mock"
    client.post("/api/v1/admin/users", json={
        "email": exp_email,
        "password": "Password@123",
        "full_name": "Expired Store Owner",
        "role": "retailer",
        "is_verified": True
    }, headers=admin_headers)
    exp_headers, _, _ = _login(client, exp_email, "Password@123")

    app_res = client.post("/api/v1/retailer/applications", json={
        "shop_name": f"Expired Wines {uuid.uuid4().hex[:4]}",
        "trade_name": "Expired Trade",
        "contact_person": "Expired Owner",
        "phone": "+91-9123456780",
        "email": exp_email,
        "address_line": "Expired St",
        "postal_code": "500081",
        "license_number": f"2B-EXP-{uuid.uuid4().hex[:4]}",
        "license_type": "2B",
        "issuing_authority": "Excise Dept",
        "issued_date": "2020-01-01",
        "expiry_date": "2023-01-01" # EXPIRED!
    }, headers=exp_headers)
    store_id = app_res.json()["id"]

    # Admin approves status
    client.patch(f"/api/v1/admin/retailers/{store_id}/review", json={
        "status": "approved",
        "review_notes": "Approved but license expired",
        "verify_license": True
    }, headers=admin_headers)

    # Expired store MUST NOT appear in public retailers listing
    public_stores = client.get("/api/v1/retailers").json()
    assert not any(s["id"] == store_id for s in public_stores)

    # Expired store public page returns 404
    public_page = client.get(f"/api/v1/retailers/{store_id}")
    assert public_page.status_code == 404

    # Expired store cannot publish inventory
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    p_id = cat_res.json()["items"][0]["id"]
    inv_add = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1000.0,
        "stock_quantity": 10
    }, headers=exp_headers)
    assert inv_add.status_code == 403
    assert "license" in inv_add.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Bug 11: Catalog Filters Consistent with Availability and Returned Details
# ---------------------------------------------------------------------------
def test_bug_11_catalog_filters_consistent_with_availability(client):
    # Setup product with 2 inventory sizes:
    # Size 180ml: Price ₹250, is_available=False, stock=0
    # Size 750ml: Price ₹1200, is_available=True, stock=15
    ret_headers, _, _ = _login(client, "retailer@madhapurwines.mock", "Retailer@123456")

    unique_brand = f"FilterBrand_{uuid.uuid4().hex[:6]}"
    unique_name = f"MultiSize Spirits {uuid.uuid4().hex[:6]}"

    # Import via bulk import
    client.post("/api/v1/retailer/inventory/import/apply", json={"items": [
        {
            "product_name": unique_name,
            "brand": unique_brand,
            "category": "Whisky",
            "bottle_size": "180ml",
            "price": 250.00,
            "stock_quantity": 0,
            "is_available": False,
            "low_stock_threshold": 5
        },
        {
            "product_name": unique_name,
            "brand": unique_brand,
            "category": "Whisky",
            "bottle_size": "750ml",
            "price": 1200.00,
            "stock_quantity": 15,
            "is_available": True,
            "low_stock_threshold": 5
        }
    ]}, headers=ret_headers)

    # 1. Query with bottle_size=180ml (unavailable/out of stock) -> Should NOT match!
    res_180 = client.get(f"/api/v1/products?brand={unique_brand}&bottle_size=180ml")
    assert res_180.status_code == 200
    assert len(res_180.json()["items"]) == 0

    # 2. Query with bottle_size=750ml (available) -> Matches!
    res_750 = client.get(f"/api/v1/products?brand={unique_brand}&bottle_size=750ml")
    assert res_750.status_code == 200
    items_750 = res_750.json()["items"]
    assert len(items_750) == 1
    matched_prod = items_750[0]
    # Starting price must reflect 750ml (₹1200), NOT ₹250!
    assert float(matched_prod["starting_price"]) == 1200.00
    assert matched_prod["available_sizes"] == ["750ml"]
    assert len(matched_prod["inventories"]) == 1
    assert matched_prod["inventories"][0]["bottle_size"] == "750ml"

    # 3. Query with price filter: max_price=300 (only matches unavailable 180ml) -> Should NOT match!
    res_cheap = client.get(f"/api/v1/products?brand={unique_brand}&max_price=300")
    assert res_cheap.status_code == 200
    assert len(res_cheap.json()["items"]) == 0

    # 4. Query with price filter: min_price=1000 -> Matches and returns ₹1200 starting price
    res_high = client.get(f"/api/v1/products?brand={unique_brand}&min_price=1000")
    assert res_high.status_code == 200
    assert len(res_high.json()["items"]) == 1
    assert float(res_high.json()["items"][0]["starting_price"]) == 1200.00


# ---------------------------------------------------------------------------
# Bug 12: SQLite Foreign Keys Enforced (PRAGMA foreign_keys = ON)
# ---------------------------------------------------------------------------
def test_bug_12_sqlite_foreign_keys_enforced(client):
    with TestSessionLocal() as session:
        # Check that PRAGMA foreign_keys is 1 (ON)
        from sqlalchemy import text
        fk_status = session.execute(text("PRAGMA foreign_keys")).scalar()
        assert fk_status == 1

        # Test CASCADE: Deleting a Cart cascades and deletes all associated CartItems
        test_user = User(
            email=f"fk_test_{uuid.uuid4().hex[:6]}@demo.mock",
            hashed_password="hashed_pw",
            full_name="FK Tester",
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True
        )
        session.add(test_user)
        session.flush()

        test_cart = Cart(user_id=test_user.id)
        session.add(test_cart)
        session.flush()

        inv = session.query(Inventory).first()
        cart_item = CartItem(
            cart_id=test_cart.id,
            inventory_id=inv.id,
            quantity=1,
            unit_price=Decimal("100.00")
        )
        session.add(cart_item)
        session.commit()

        cart_id = test_cart.id
        item_id = cart_item.id

        # Verify item exists
        assert session.query(CartItem).filter(CartItem.id == item_id).first() is not None

        # Delete cart
        session.delete(test_cart)
        session.commit()

        # Item must be cascaded and deleted
        assert session.query(CartItem).filter(CartItem.id == item_id).first() is None


# ---------------------------------------------------------------------------
# Bug 13: Headerless CSV Preview Parses All Rows Without Skipping Row 0
# ---------------------------------------------------------------------------
def test_bug_13_headerless_csv_preview_parses_all_rows(client):
    ret_headers, _, _ = _login(client, "retailer@madhapurwines.mock", "Retailer@123456")

    # 1. Single-row headerless CSV
    # Columns: Product Name, Brand, Category, Bottle Size, Price, Stock Quantity, Available, Low Stock Threshold
    single_row_csv = "Single Row Rum,Old Monk,Rum,750ml,950,30,TRUE,5"
    preview_single = client.post("/api/v1/retailer/inventory/import/preview", json={"raw_csv": single_row_csv}, headers=ret_headers)
    assert preview_single.status_code == 200
    data_single = preview_single.json()
    assert data_single["total_rows"] == 1
    assert data_single["valid_rows"] == 1
    assert data_single["rows"][0]["product_name"] == "Single Row Rum"
    assert data_single["rows"][0]["row_number"] == 1

    # 2. Multi-row headerless CSV (2 rows)
    multi_row_csv = (
        "Multi Row Whisky,Antiquity,Whisky,750ml,1800,20,TRUE,5\n"
        "Multi Row Beer,Bira,Beer,650ml,220,50,TRUE,10"
    )
    preview_multi = client.post("/api/v1/retailer/inventory/import/preview", json={"raw_csv": multi_row_csv}, headers=ret_headers)
    assert preview_multi.status_code == 200
    data_multi = preview_multi.json()
    assert data_multi["total_rows"] == 2
    assert data_multi["valid_rows"] == 2
    assert data_multi["rows"][0]["product_name"] == "Multi Row Whisky"
    assert data_multi["rows"][0]["row_number"] == 1
    assert data_multi["rows"][1]["product_name"] == "Multi Row Beer"
    assert data_multi["rows"][1]["row_number"] == 2

    # 3. Normal CSV with headers (still works seamlessly)
    header_csv = (
        "Product Name,Brand,Category,Bottle Size,Price,Stock Quantity,Available,Low Stock Threshold\n"
        "Header Item One,Brand A,Vodka,750ml,1100,15,TRUE,5\n"
        "Header Item Two,Brand B,Gin,750ml,1400,10,TRUE,5"
    )
    preview_header = client.post("/api/v1/retailer/inventory/import/preview", json={"raw_csv": header_csv}, headers=ret_headers)
    assert preview_header.status_code == 200
    data_hdr = preview_header.json()
    assert data_hdr["total_rows"] == 2
    assert data_hdr["valid_rows"] == 2
    assert data_hdr["rows"][0]["product_name"] == "Header Item One"
    assert data_hdr["rows"][0]["row_number"] == 2


# ---------------------------------------------------------------------------
# Additional Bug Fixes: Admin Role Preservation & Payout Consistency
# ---------------------------------------------------------------------------
def test_admin_not_demoted_when_linking_to_retailer(client):
    admin_headers, _, _ = _login(client, "admin@telanganaliquor.gov.mock", "Admin@123456")
    ret_owner_headers, _, _ = _login(client, "retailer@madhapurwines.mock", "Retailer@123456")
    dash = client.get("/api/v1/retailer/dashboard", headers=ret_owner_headers).json()
    store_id = dash["retailer"]["id"]

    # Retailer creates an invitation
    inv_res = client.post(
        "/api/v1/retailer/invitations",
        json={"role_in_retailer": "MANAGER"},
        headers=ret_owner_headers
    )
    assert inv_res.status_code == 201
    inv_code = inv_res.json()["code"]

    # Admin applies to link using invitation
    link_res = client.post(
        "/api/v1/retailer/applications",
        json={
            "shop_name": "Admin Joined Branch",
            "contact_person": "Admin User",
            "phone": "+91-9876543210",
            "email": "admin@telanganaliquor.gov.mock",
            "address_line": "Secretariat Rd",
            "postal_code": "500022",
            "license_number": f"LIC-ADM-{uuid.uuid4().hex[:6]}",
            "issued_date": "2024-01-01",
            "expiry_date": "2027-01-01",
            "existing_retailer_id": store_id,
            "invitation_code": inv_code
        },
        headers=admin_headers
    )
    assert link_res.status_code == 201

    # Verify admin profile STILL has role 'admin'
    me_res = client.get("/api/v1/auth/me", headers=admin_headers)
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "admin"


def test_delivery_payout_and_order_route_consistency(client):
    dp_headers, _, _ = _login(client, "partner@demo.com", "Partner@123456")

    # Available delivery orders should report ₹75 payout
    orders_res = client.get("/api/v1/delivery/available-orders", headers=dp_headers)
    assert orders_res.status_code == 200
    avail_orders = orders_res.json()
    if avail_orders:
        for ord_item in avail_orders:
            assert float(ord_item["payout_amount"]) == 75.0

    # Orders route works cleanly for admin as well as customer
    admin_headers, _, _ = _login(client, "admin@telanganaliquor.gov.mock", "Admin@123456")
    admin_orders_res = client.get("/api/v1/orders", headers=admin_headers)
    assert admin_orders_res.status_code == 200
    assert isinstance(admin_orders_res.json(), list)


