import pytest
import uuid
from decimal import Decimal
from app.models.retailer import Retailer, RetailerStatus, RetailerLicense, RetailerMembership
from app.models.product import Inventory, Product, Category, InventoryMovement
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User, UserRole

def get_auth_retailer(client, email_prefix="adv_retailer"):
    email = f"{email_prefix}_{uuid.uuid4().hex[:6]}@telanganamock.gov"
    pwd = "TestPassword@123"
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Advanced Retailer Owner",
        "role": "retailer"
    })
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    lic_num = f"TS-HYD-ADV-{uuid.uuid4().hex[:6].upper()}"
    app_res = client.post("/api/v1/retailer/applications", json={
        "shop_name": f"Premium Cellars {email_prefix} {uuid.uuid4().hex[:4]}",
        "contact_person": "Advanced Retailer Owner",
        "phone": "+91-9988771122",
        "email": email,
        "address_line": "Jubilee Hills Check Post",
        "city": "Hyderabad",
        "state": "Telangana",
        "postal_code": "500033",
        "license_number": lic_num,
        "license_type": "A4 Retail Wine Shop",
        "issuing_authority": "Prohibition & Excise Department, Govt of Telangana",
        "issued_date": "2024-04-01",
        "expiry_date": "2027-03-31",
        "document_url": "https://mock-storage.telangana.gov/licenses/adv-test.pdf"
    }, headers=headers)
    assert app_res.status_code == 201
    retailer_id = app_res.json()["id"]

    # Admin approves retailer
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    review_res = client.patch(f"/api/v1/admin/retailers/{retailer_id}/review", json={
        "status": "approved",
        "review_notes": "All documentation verified for test suite",
        "verify_license": True
    }, headers=admin_headers)
    assert review_res.status_code == 200

    return headers, retailer_id

def test_summary_metrics_correctness(client):
    headers, retailer_id = get_auth_retailer(client, "metrics_user")
    cat_res = client.get("/api/v1/products")
    products = cat_res.json()["items"]
    p1 = products[0]["id"]
    p2 = products[1]["id"]
    p3 = products[2]["id"]

    # 1. In-stock item (stock > threshold)
    client.post("/api/v1/retailer/inventory", json={
        "product_id": p1,
        "bottle_size": "750ml",
        "price": 1200.00,
        "stock_quantity": 25,
        "is_available": True,
        "low_stock_threshold": 5
    }, headers=headers)

    # 2. Low-stock item (0 < stock <= threshold)
    client.post("/api/v1/retailer/inventory", json={
        "product_id": p1,
        "bottle_size": "375ml",
        "price": 650.00,
        "stock_quantity": 4,
        "is_available": True,
        "low_stock_threshold": 5
    }, headers=headers)

    # 3. Out-of-stock item (stock == 0)
    client.post("/api/v1/retailer/inventory", json={
        "product_id": p2,
        "bottle_size": "750ml",
        "price": 2800.00,
        "stock_quantity": 0,
        "is_available": True,
        "low_stock_threshold": 5
    }, headers=headers)

    # 4. Inactive listing (is_available == False, stock > 0)
    # Crucial rule: inactive listings must NOT be counted as available in-stock!
    client.post("/api/v1/retailer/inventory", json={
        "product_id": p3,
        "bottle_size": "750ml",
        "price": 3500.00,
        "stock_quantity": 10,
        "is_available": True,
        "low_stock_threshold": 5
    }, headers=headers)
    # update to inactive
    inv_list = client.get("/api/v1/retailer/inventory", headers=headers).json()
    item4 = next(i for i in inv_list["items"] if i["product_id"] == p3)
    client.patch(f"/api/v1/retailer/inventory/{item4['id']}", json={"is_available": False}, headers=headers)

    # Fetch updated inventory and verify summary metrics
    res = client.get("/api/v1/retailer/inventory", headers=headers)
    assert res.status_code == 200
    summary = res.json()["summary"]

    assert summary["total_listings"] == 4
    # In stock: item 1 (25) and item 2 (4) are available and stock > 0
    assert summary["in_stock_listings"] == 2
    # Low stock: item 2 (stock 4 <= threshold 5)
    assert summary["low_stock_listings"] == 1
    # Out of stock: item 3 (stock 0)
    assert summary["out_of_stock_listings"] == 1
    # Inactive: item 4
    assert summary["inactive_listings"] == 1
    # Total units: 25 + 4 + 0 + 10 = 39
    assert summary["total_units"] == 39

def test_search_filters_and_sorting(client):
    headers, retailer_id = get_auth_retailer(client, "filter_user")
    cat_res = client.get("/api/v1/products")
    products = cat_res.json()["items"]

    for idx, p in enumerate(products[:4]):
        client.post("/api/v1/retailer/inventory", json={
            "product_id": p["id"],
            "bottle_size": "750ml",
            "price": float(500 * (idx + 1)),
            "stock_quantity": 10 * (idx + 1),
            "is_available": True,
            "low_stock_threshold": 5
        }, headers=headers)

    # 1. Search by name/brand
    first_p = products[0]
    res_search = client.get(f"/api/v1/retailer/inventory?search={first_p['name'][:5]}", headers=headers)
    assert res_search.status_code == 200
    assert len(res_search.json()["items"]) >= 1
    assert first_p["name"] in [i["product_name"] for i in res_search.json()["items"]]

    # 2. Filter by category
    cat_id = first_p["category_id"]
    res_cat = client.get(f"/api/v1/retailer/inventory?category_id={cat_id}", headers=headers)
    assert res_cat.status_code == 200
    for it in res_cat.json()["items"]:
        assert it["category_id"] == cat_id

    # 3. Sorting by price asc / desc
    res_sort_asc = client.get("/api/v1/retailer/inventory?sort_by=price&sort_order=asc", headers=headers)
    prices_asc = [float(i["price"]) for i in res_sort_asc.json()["items"]]
    assert prices_asc == sorted(prices_asc)

    res_sort_desc = client.get("/api/v1/retailer/inventory?sort_by=price&sort_order=desc", headers=headers)
    prices_desc = [float(i["price"]) for i in res_sort_desc.json()["items"]]
    assert prices_desc == sorted(prices_desc, reverse=True)

    # 4. Pagination
    res_page = client.get("/api/v1/retailer/inventory?page=1&page_size=2", headers=headers)
    data = res_page.json()
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total"] == 4
    assert data["total_pages"] == 2

def test_low_stock_threshold_boundaries(client):
    headers, retailer_id = get_auth_retailer(client, "boundary_user")
    p_id = client.get("/api/v1/products").json()["items"][0]["id"]

    # Boundary test: stock == low_stock_threshold (5 == 5) -> must be classified as low stock
    res = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1000.00,
        "stock_quantity": 5,
        "is_available": True,
        "low_stock_threshold": 5
    }, headers=headers)
    assert res.status_code == 201

    inv_res = client.get("/api/v1/retailer/inventory?stock_status=low_stock", headers=headers)
    assert inv_res.status_code == 200
    assert len(inv_res.json()["items"]) == 1
    assert inv_res.json()["summary"]["low_stock_listings"] == 1

def test_stock_adjustment_and_movement_history(client):
    headers, retailer_id = get_auth_retailer(client, "adj_user")
    p_id = client.get("/api/v1/products").json()["items"][0]["id"]

    # 1. Create listing with initial stock 10
    create_res = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1500.00,
        "stock_quantity": 10,
        "is_available": True,
        "low_stock_threshold": 5
    }, headers=headers)
    inv_id = create_res.json()["id"]

    # 2. Check initial movement record
    mov_res = client.get(f"/api/v1/retailer/inventory/{inv_id}/movements", headers=headers)
    assert mov_res.status_code == 200
    movements = mov_res.json()
    assert len(movements) == 1
    assert movements[0]["reason"] == "INITIAL_LISTING"
    assert movements[0]["previous_quantity"] == 0
    assert movements[0]["new_quantity"] == 10
    assert movements[0]["change_quantity"] == 10

    # 3. Perform stock adjustment dialog action (e.g. restock +15 -> new quantity 25)
    adj_res = client.post(f"/api/v1/retailer/inventory/{inv_id}/adjust-stock", json={
        "new_quantity": 25,
        "reason": "RESTOCK",
        "notes": "Consignment from Telangana State Beverages Corporation Ltd (TSBCL)"
    }, headers=headers)
    assert adj_res.status_code == 200
    assert adj_res.json()["stock_quantity"] == 25
    assert adj_res.json()["version"] == 2

    # 4. Perform second adjustment (damaged -3 -> new quantity 22)
    adj_res2 = client.post(f"/api/v1/retailer/inventory/{inv_id}/adjust-stock", json={
        "new_quantity": 22,
        "reason": "DAMAGED_EXPIRED",
        "notes": "3 bottles broken during warehouse shelf transit",
        "expected_version": 2
    }, headers=headers)
    assert adj_res2.status_code == 200
    assert adj_res2.json()["stock_quantity"] == 22
    assert adj_res2.json()["version"] == 3

    # 5. Verify movements chronological history
    mov_res2 = client.get(f"/api/v1/retailer/inventory/{inv_id}/movements", headers=headers)
    assert mov_res2.status_code == 200
    all_movs = mov_res2.json()
    assert len(all_movs) == 3
    # Latest first
    assert all_movs[0]["reason"] == "DAMAGED_EXPIRED"
    assert all_movs[0]["previous_quantity"] == 25
    assert all_movs[0]["new_quantity"] == 22
    assert all_movs[0]["change_quantity"] == -3

    assert all_movs[1]["reason"] == "RESTOCK"
    assert all_movs[1]["previous_quantity"] == 10
    assert all_movs[1]["new_quantity"] == 25
    assert all_movs[1]["change_quantity"] == 15

def test_negative_stock_rejection(client):
    headers, retailer_id = get_auth_retailer(client, "neg_user")
    p_id = client.get("/api/v1/products").json()["items"][0]["id"]

    # 1. Negative in creation -> 422 / 400
    res_neg_create = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1000.00,
        "stock_quantity": -5
    }, headers=headers)
    assert res_neg_create.status_code in [400, 422]

    # 2. Create valid listing
    valid = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1000.00,
        "stock_quantity": 10
    }, headers=headers)
    inv_id = valid.json()["id"]

    # 3. Negative in adjustment -> rejected
    res_neg_adj = client.post(f"/api/v1/retailer/inventory/{inv_id}/adjust-stock", json={
        "new_quantity": -2,
        "reason": "RESTOCK"
    }, headers=headers)
    assert res_neg_adj.status_code in [400, 422]

def test_duplicate_listing_prevention(client):
    headers, retailer_id = get_auth_retailer(client, "dup_user")
    p_id = client.get("/api/v1/products").json()["items"][0]["id"]

    # 1. Create 750ml listing
    first = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1200.00,
        "stock_quantity": 15
    }, headers=headers)
    assert first.status_code == 201

    # 2. Duplicate creation for same size -> 400 Bad Request
    dup = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1300.00,
        "stock_quantity": 5
    }, headers=headers)
    assert dup.status_code == 400
    assert "already exists for this product" in dup.json()["detail"]

def test_concurrency_optimistic_locking(client):
    headers, retailer_id = get_auth_retailer(client, "conc_user")
    p_id = client.get("/api/v1/products").json()["items"][0]["id"]

    create_res = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 2000.00,
        "stock_quantity": 50
    }, headers=headers)
    inv_id = create_res.json()["id"]

    # First update increments version to 2
    client.post(f"/api/v1/retailer/inventory/{inv_id}/adjust-stock", json={
        "new_quantity": 45,
        "reason": "STOCK_AUDIT"
    }, headers=headers)

    # Concurrency test: User A attempts update with stale version 1 -> 409 Conflict!
    stale_adj = client.post(f"/api/v1/retailer/inventory/{inv_id}/adjust-stock", json={
        "new_quantity": 40,
        "reason": "STOCK_AUDIT",
        "expected_version": 1
    }, headers=headers)
    assert stale_adj.status_code == 409
    assert "Concurrent modification detected" in stale_adj.json()["detail"]

    # Retry with correct version 2 -> succeeds
    valid_adj = client.post(f"/api/v1/retailer/inventory/{inv_id}/adjust-stock", json={
        "new_quantity": 40,
        "reason": "STOCK_AUDIT",
        "expected_version": 2
    }, headers=headers)
    assert valid_adj.status_code == 200
    assert valid_adj.json()["stock_quantity"] == 40
    assert valid_adj.json()["version"] == 3

def test_cross_retailer_authorization(client):
    headers_a, ret_a_id = get_auth_retailer(client, "retailer_a")
    headers_b, ret_b_id = get_auth_retailer(client, "retailer_b")

    p_id = client.get("/api/v1/products").json()["items"][0]["id"]

    # Retailer A creates listing
    inv_a = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1000.00,
        "stock_quantity": 10
    }, headers=headers_a).json()

    # Retailer B tries to adjust Retailer A's stock -> 403 Forbidden
    res_b_adj = client.post(f"/api/v1/retailer/inventory/{inv_a['id']}/adjust-stock", json={
        "new_quantity": 100,
        "reason": "ILLEGAL_OVERRIDE"
    }, headers=headers_b)
    assert res_b_adj.status_code == 403
    assert "Security violation" in res_b_adj.json()["detail"]

    # Retailer B tries to view Retailer A's movements -> 403 Forbidden
    res_b_mov = client.get(f"/api/v1/retailer/inventory/{inv_a['id']}/movements", headers=headers_b)
    assert res_b_mov.status_code == 403

def test_order_reference_soft_deactivation(client, db_session):
    headers, retailer_id = get_auth_retailer(client, "order_ref_user")
    p_id = client.get("/api/v1/products").json()["items"][0]["id"]

    inv_res = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1500.00,
        "stock_quantity": 20
    }, headers=headers)
    inv_id = inv_res.json()["id"]

    # 1. Without orders, item can be hard deleted
    del_res = client.delete(f"/api/v1/retailer/inventory/{inv_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["action"] == "deleted"

    # 2. Re-create item and link an order
    inv2 = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1500.00,
        "stock_quantity": 20
    }, headers=headers).json()
    inv2_id = inv2["id"]

    # Create dummy Order and OrderItem in db
    cust = db_session.query(User).filter(User.role == UserRole.CUSTOMER).first()
    order = Order(
        order_number=f"SIM-TEST-{uuid.uuid4().hex[:6].upper()}",
        user_id=cust.id,
        retailer_id=retailer_id,
        status=OrderStatus.COMPLETED,
        subtotal=Decimal("1500.00"),
        delivery_fee=Decimal("0.00"),
        taxes=Decimal("0.00"),
        total_amount=Decimal("1500.00"),
        address_snapshot="Test Address",
        is_simulated=True
    )
    db_session.add(order)
    db_session.flush()

    order_item = OrderItem(
        order_id=order.id,
        inventory_id=inv2_id,
        product_name="Test Product",
        brand="Test Brand",
        bottle_size="750ml",
        unit_price=Decimal("1500.00"),
        quantity=1,
        total_price=Decimal("1500.00")
    )
    db_session.add(order_item)
    db_session.commit()

    # Retailer attempts to delete: must NOT be hard-deleted, but safely deactivated to preserve audit history!
    del_res2 = client.delete(f"/api/v1/retailer/inventory/{inv2_id}", headers=headers)
    assert del_res2.status_code == 200
    assert del_res2.json()["action"] == "deactivated"
    assert "preserve statutory audit history" in del_res2.json()["message"]

    # Verify item is still in DB with is_available = False
    inv_db = db_session.query(Inventory).filter(Inventory.id == inv2_id).first()
    assert inv_db is not None
    assert inv_db.is_available is False


def test_automatic_stock_deduction_on_order_acceptance(client, db_session):
    # 1. Setup retailer and product inventory with 20 bottles
    headers, retailer_id = get_auth_retailer(client, "stock_deduct_owner")
    cat_res = client.get("/api/v1/products")
    p_id = cat_res.json()["items"][0]["id"]

    inv_res = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 1800.00,
        "stock_quantity": 20
    }, headers=headers)
    assert inv_res.status_code == 201
    inv_id = inv_res.json()["id"]

    # 2. Register & login customer
    cust_email = f"cust_stock_{uuid.uuid4().hex[:6]}@demo.mock"
    client.post("/api/v1/auth/register", json={
        "email": cust_email,
        "password": "Password@123",
        "full_name": "Stock Test Customer",
        "role": "customer"
    })
    cust_login = client.post("/api/v1/auth/login", json={"email": cust_email, "password": "Password@123"})
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    # 3. Customer adds 4 units to cart and checks out
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 4}, headers=cust_headers)
    checkout_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert checkout_res.status_code == 201
    order_id = checkout_res.json()[0]["id"]
    assert checkout_res.json()[0]["status"] == "created"

    # 4. Before retailer accepts order: stock is still 20 (held, not yet deducted)
    inv_list = client.get("/api/v1/retailer/inventory", headers=headers).json()["items"]
    inv_check = next(i for i in inv_list if i["id"] == inv_id)
    assert inv_check["stock_quantity"] == 20

    # 5. Retailer ACCEPTS the order -> status transitions to 'confirmed'
    accept_res = client.patch(
        f"/api/v1/retailer/orders/{order_id}/status",
        json={"status": "confirmed", "notes": "Order accepted and packing started"},
        headers=headers
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "confirmed"

    # 6. Verify inventory stock is AUTOMATICALLY decreased from 20 -> 16 (20 - 4)
    inv_list_after = client.get("/api/v1/retailer/inventory", headers=headers).json()["items"]
    inv_after = next(i for i in inv_list_after if i["id"] == inv_id)
    assert inv_after["stock_quantity"] == 16

    # 7. Verify InventoryMovement history was recorded automatically
    movements_res = client.get(f"/api/v1/retailer/inventory/{inv_id}/movements", headers=headers)
    assert movements_res.status_code == 200
    movements = movements_res.json()
    fulfillment_m = next((m for m in movements if m["reason"] == "ORDER_FULFILLMENT"), None)
    assert fulfillment_m is not None
    assert fulfillment_m["change_quantity"] == -4
    assert fulfillment_m["previous_quantity"] == 20
    assert fulfillment_m["new_quantity"] == 16

    # 8. Test cancellation restoration: If order is cancelled, stock is restored automatically to 20
    cancel_res = client.patch(
        f"/api/v1/retailer/orders/{order_id}/status",
        json={"status": "cancelled", "notes": "Customer requested cancellation"},
        headers=headers
    )
    assert cancel_res.status_code == 200
    inv_list_restored = client.get("/api/v1/retailer/inventory", headers=headers).json()["items"]
    inv_restored = next(i for i in inv_list_restored if i["id"] == inv_id)
    assert inv_restored["stock_quantity"] == 20

