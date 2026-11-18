import pytest
from app.models.product import Inventory
from app.models.order import Order, OrderStatus
from app.models.user import User


def get_auth_headers(client, email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_reproduce_bug1_cancellation_after_pickup_disallowed(client, db_session):
    """
    Bug 1: An OUT_FOR_DELIVERY order must not be cancelled through normal cancellation
    or status update paths and automatically returned to sellable stock.
    """
    cust_headers = get_auth_headers(client, "customer@demo.com", "Customer@123456")
    ret_headers = get_auth_headers(client, "retailer@madhapurwines.mock", "Retailer@123456")
    dp_headers = get_auth_headers(client, "partner@demo.com", "Partner@123456")

    # Get product and inventory
    cat_res = client.get("/api/v1/products")
    inv_id = cat_res.json()["items"][0]["inventories"][0]["id"]

    initial_inv = db_session.query(Inventory).filter(Inventory.id == inv_id).first()
    initial_stock = initial_inv.stock_quantity

    # Add to cart and create simulated order
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 2}, headers=cust_headers)
    order_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert order_res.status_code == 201
    order_id = order_res.json()[0]["id"]

    # Retailer confirms order -> stock decreases by 2
    r_conf = client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)
    assert r_conf.status_code == 200

    db_session.expire_all()
    inv_after_conf = db_session.query(Inventory).filter(Inventory.id == inv_id).first()
    assert inv_after_conf.stock_quantity == initial_stock - 2

    # Retailer prepares and marks order ready
    r_prep = client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "preparing"}, headers=ret_headers)
    assert r_prep.status_code == 200
    r_ready = client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "ready"}, headers=ret_headers)
    assert r_ready.status_code == 200

    # Delivery partner accepts and picks up order -> OUT_FOR_DELIVERY
    client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    p_res = client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)
    assert p_res.status_code == 200

    # 1. Customer cancellation path must be rejected (HTTP 400)
    cust_cancel_res = client.post(f"/api/v1/orders/{order_id}/cancel", headers=cust_headers)
    assert cust_cancel_res.status_code == 400, "Customer should not be able to cancel an order once out for delivery"

    # 2. Status update cancellation path must be rejected (HTTP 400)
    ret_cancel_res = client.patch(
        f"/api/v1/retailer/orders/{order_id}/status",
        json={"status": "cancelled", "notes": "Customer cancelled while out for delivery"},
        headers=ret_headers
    )
    assert ret_cancel_res.status_code == 400, "Retailer/actor should not be able to cancel order in OUT_FOR_DELIVERY"

    # 3. Stock must NOT have been restored
    db_session.expire_all()
    inv_after_attempt = db_session.query(Inventory).filter(Inventory.id == inv_id).first()
    assert inv_after_attempt.stock_quantity == initial_stock - 2, "Stock must remain deducted while out for delivery"


def test_reproduce_bug2_concurrent_inventory_edits(client, db_session):
    """
    Bug 2: Stock updates must use an atomic version check so two requests
    based on the same inventory version cannot both succeed. Return a 409 conflict
    response for the stale request. Covers stock adjustments and inline inventory edits.
    """
    ret_headers = get_auth_headers(client, "retailer@madhapurwines.mock", "Retailer@123456")

    # Get an inventory listing
    inv_list = client.get("/api/v1/retailer/inventory", headers=ret_headers).json()["items"]
    target_inv = inv_list[0]
    inv_id = target_inv["id"]
    current_ver = target_inv["version"]

    # 1. Stock Adjustment concurrency test
    # Request 1 with version current_ver succeeds
    adj_1 = client.post(
        f"/api/v1/retailer/inventory/{inv_id}/adjust-stock",
        json={
            "new_quantity": 40,
            "reason": "STOCK_AUDIT",
            "notes": "Adjustment 1",
            "expected_version": current_ver
        },
        headers=ret_headers
    )
    assert adj_1.status_code == 200
    new_ver = adj_1.json()["version"]
    assert new_ver == current_ver + 1

    # Request 2 with the stale version (current_ver) must return 409 Conflict
    adj_stale = client.post(
        f"/api/v1/retailer/inventory/{inv_id}/adjust-stock",
        json={
            "new_quantity": 35,
            "reason": "STOCK_AUDIT",
            "notes": "Adjustment 2 with stale version",
            "expected_version": current_ver
        },
        headers=ret_headers
    )
    assert adj_stale.status_code == 409, "Stale stock adjustment must return 409 Conflict"

    # 2. Inline Inventory Edit concurrency test
    # Request 1 with current version succeeds
    inline_1 = client.patch(
        f"/api/v1/retailer/inventory/{inv_id}",
        json={
            "price": "950.00",
            "stock_quantity": 45,
            "expected_version": new_ver
        },
        headers=ret_headers
    )
    assert inline_1.status_code == 200
    v3 = inline_1.json()["version"]
    assert v3 == new_ver + 1

    # Request 2 with stale version new_ver must return 409 Conflict
    inline_stale = client.patch(
        f"/api/v1/retailer/inventory/{inv_id}",
        json={
            "price": "920.00",
            "stock_quantity": 50,
            "expected_version": new_ver
        },
        headers=ret_headers
    )
    assert inline_stale.status_code == 409, "Stale inline inventory edit must return 409 Conflict"


def test_reproduce_bug3_premature_delivery_readiness(client, db_session):
    """
    Bug 3: A delivery partner may accept only an order already marked READY by the retailer.
    Accepting it must not change its status from CONFIRMED or PREPARING.
    """
    cust_headers = get_auth_headers(client, "customer@demo.com", "Customer@123456")
    ret_headers = get_auth_headers(client, "retailer@madhapurwines.mock", "Retailer@123456")
    dp_headers = get_auth_headers(client, "partner@demo.com", "Partner@123456")

    cat_res = client.get("/api/v1/products")
    inv_id = cat_res.json()["items"][0]["inventories"][0]["id"]

    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)
    order_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    order_id = order_res.json()[0]["id"]

    # Order is confirmed by retailer
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)

    # 1. Must NOT be in available-orders pool while merely CONFIRMED
    avail_res = client.get("/api/v1/delivery/available-orders", headers=dp_headers)
    assert avail_res.status_code == 200
    avail_ids = [o["order_id"] for o in avail_res.json()]
    assert order_id not in avail_ids, "Order in CONFIRMED state must not be available for delivery pickup"

    # 2. Delivery partner cannot accept CONFIRMED order
    accept_conf = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert accept_conf.status_code == 400, "Delivery partner cannot accept a CONFIRMED order"

    # Status must NOT have been changed to READY
    db_session.expire_all()
    ord_check = db_session.query(Order).filter(Order.id == order_id).first()
    assert ord_check.status == OrderStatus.CONFIRMED

    # 3. Move to PREPARING -> still cannot accept
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "preparing"}, headers=ret_headers)

    avail_res2 = client.get("/api/v1/delivery/available-orders", headers=dp_headers)
    avail_ids2 = [o["order_id"] for o in avail_res2.json()]
    assert order_id not in avail_ids2, "Order in PREPARING state must not be available for delivery pickup"

    accept_prep = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert accept_prep.status_code == 400, "Delivery partner cannot accept a PREPARING order"

    # 4. Retailer marks order READY
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "ready"}, headers=ret_headers)

    # Now it is in available pool
    avail_res3 = client.get("/api/v1/delivery/available-orders", headers=dp_headers)
    avail_ids3 = [o["order_id"] for o in avail_res3.json()]
    assert order_id in avail_ids3, "Order in READY state must be available for pickup"

    # Delivery partner accepts
    accept_ready = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert accept_ready.status_code == 200

    # Status remains READY
    db_session.expire_all()
    ord_ready = db_session.query(Order).filter(Order.id == order_id).first()
    assert ord_ready.status == OrderStatus.READY
    assert ord_ready.delivery_partner_id is not None


def test_reproduce_bug4_admin_status_skips_enforce_transitions(client, db_session):
    """
    Bug 4: Prevent admin status changes from bypassing inventory deduction or causing
    stock to be restored when it was never deducted. Enforce valid order transitions
    for admins too.
    """
    cust_headers = get_auth_headers(client, "customer@demo.com", "Customer@123456")
    admin_headers = get_auth_headers(client, "admin@telanganaliquor.gov.mock", "Admin@123456")

    cat_res = client.get("/api/v1/products")
    inv_id = cat_res.json()["items"][0]["inventories"][0]["id"]

    initial_stock = db_session.query(Inventory).filter(Inventory.id == inv_id).first().stock_quantity

    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)
    order_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    order_id = order_res.json()[0]["id"]

    # Admin attempts to skip from CREATED directly to READY
    # Should be rejected (HTTP 400) because valid transitions for CREATED are only [CONFIRMED, REJECTED, CANCELLED]
    skip_to_ready = client.patch(
        f"/api/v1/retailer/orders/{order_id}/status",
        json={"status": "ready", "notes": "Admin skipping directly to ready"},
        headers=admin_headers
    )
    assert skip_to_ready.status_code == 400, "Admin must not bypass state machine transitions"

    # Admin attempts to skip from CREATED directly to PREPARING
    skip_to_prep = client.patch(
        f"/api/v1/retailer/orders/{order_id}/status",
        json={"status": "preparing", "notes": "Admin skipping directly to preparing"},
        headers=admin_headers
    )
    assert skip_to_prep.status_code == 400, "Admin must not skip from created to preparing"

    # Verify inventory was never deducted
    db_session.expire_all()
    cur_stock = db_session.query(Inventory).filter(Inventory.id == inv_id).first().stock_quantity
    assert cur_stock == initial_stock
