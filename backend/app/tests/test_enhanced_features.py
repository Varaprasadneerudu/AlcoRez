import pytest
import io
import uuid
from decimal import Decimal
from app.core.config import Settings

# --- Test Authentication Helpers ---
def get_customer_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    return res.json()["access_token"]

def get_retailer_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    return res.json()["access_token"]

def get_admin_token(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    return res.json()["access_token"]

# ==========================================
# Feature A: Customer Favorites Tests
# ==========================================

def test_customer_favorites_lifecycle(client):
    token = get_customer_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch a product and retailer
    products_res = client.get("/api/v1/products")
    product_id = products_res.json()["items"][0]["id"]

    retailers_res = client.get("/api/v1/retailers")
    retailer_id = retailers_res.json()[0]["id"]

    # 1. Add favorite product
    add_p = client.post(f"/api/v1/customer/favorites/products/{product_id}", headers=headers)
    assert add_p.status_code == 201

    # 2. Add favorite retailer
    add_r = client.post(f"/api/v1/customer/favorites/retailers/{retailer_id}", headers=headers)
    assert add_r.status_code == 201

    # 3. Check IDs endpoint
    ids_res = client.get("/api/v1/customer/favorites/ids", headers=headers)
    assert ids_res.status_code == 200
    ids_data = ids_res.json()
    assert product_id in ids_data["product_ids"]
    assert retailer_id in ids_data["retailer_ids"]

    # 4. Check full favorites list
    favs_res = client.get("/api/v1/customer/favorites", headers=headers)
    assert favs_res.status_code == 200
    favs_data = favs_res.json()
    assert any(p["product_id"] == product_id for p in favs_data["products"])
    assert any(r["retailer_id"] == retailer_id for r in favs_data["retailers"])

    # 5. Remove favorite product & retailer
    del_p = client.delete(f"/api/v1/customer/favorites/products/{product_id}", headers=headers)
    assert del_p.status_code == 204

    del_r = client.delete(f"/api/v1/customer/favorites/retailers/{retailer_id}", headers=headers)
    assert del_r.status_code == 204

    # Verify removal
    ids_after = client.get("/api/v1/customer/favorites/ids", headers=headers).json()
    assert product_id not in ids_after["product_ids"]
    assert retailer_id not in ids_after["retailer_ids"]

def test_customer_favorites_data_isolation(client):
    # Customer 1
    c1_token = get_customer_token(client)
    headers_c1 = {"Authorization": f"Bearer {c1_token}"}

    # Customer 2 (unique registration)
    c2_email = f"fav_user_{uuid.uuid4().hex[:6]}@demo.com"
    client.post("/api/v1/auth/register", json={
        "email": c2_email,
        "password": "Password@123",
        "full_name": "Isolated User",
        "date_of_birth": "1992-05-10"
    })
    login_c2 = client.post("/api/v1/auth/login", json={
        "email": c2_email,
        "password": "Password@123"
    })
    headers_c2 = {"Authorization": f"Bearer {login_c2.json()['access_token']}"}

    # Customer 1 adds a favorite product
    products = client.get("/api/v1/products").json()["items"]
    p_id = products[0]["id"]
    client.post(f"/api/v1/customer/favorites/products/{p_id}", headers=headers_c1)

    # Customer 2 must have an empty favorites list
    c2_favs = client.get("/api/v1/customer/favorites", headers=headers_c2).json()
    assert len(c2_favs["products"]) == 0
    assert len(c2_favs["retailers"]) == 0

    c2_ids = client.get("/api/v1/customer/favorites/ids", headers=headers_c2).json()
    assert p_id not in c2_ids["product_ids"]

    # Clean up Customer 1
    client.delete(f"/api/v1/customer/favorites/products/{p_id}", headers=headers_c1)

def test_favorites_requires_customer_auth(client):
    # Unauthenticated request
    res = client.get("/api/v1/customer/favorites")
    assert res.status_code == 401

# ==========================================
# Feature B: Retailer Discovery & Locality Tests
# ==========================================

def test_retailer_locality_filtering(client):
    # Fetch all approved retailers
    all_rets = client.get("/api/v1/retailers").json()
    assert len(all_rets) >= 2

    # Filter by Madhapur PIN code 500081
    madhapur_rets = client.get("/api/v1/retailers?postal_code=500081").json()
    assert len(madhapur_rets) >= 1
    assert all(r["postal_code"] == "500081" for r in madhapur_rets)

    # Filter by Jubilee Hills PIN code 500033
    jubilee_rets = client.get("/api/v1/retailers?postal_code=500033").json()
    assert len(jubilee_rets) >= 1
    assert all(r["postal_code"] == "500033" for r in jubilee_rets)

    # Filter products by locality PIN code
    prods_500081 = client.get("/api/v1/products?postal_code=500081").json()
    assert prods_500081["total"] >= 1

def test_retailer_details_and_verification_status(client):
    rets = client.get("/api/v1/retailers").json()
    ret_id = rets[0]["id"]

    detail = client.get(f"/api/v1/retailers/{ret_id}").json()
    assert detail["id"] == ret_id
    assert detail["status"] == "approved"
    assert detail["license"] is not None
    assert detail["license"]["is_verified"] is True
    assert "A4" in detail["license"]["license_type"]
    assert detail["license"]["expiry_date"] is not None
    assert "last_inventory_update" in detail

    # Retailer catalogue endpoint
    cat_res = client.get(f"/api/v1/retailers/{ret_id}/catalogue")
    assert cat_res.status_code == 200
    cat_data = cat_res.json()
    assert cat_data["retailer"]["id"] == ret_id
    assert "items" in cat_data

# ==========================================
# Feature C: Notification Center Tests
# ==========================================

def test_notifications_lifecycle_and_unread_counts(client):
    ret_token = get_retailer_token(client)
    headers = {"Authorization": f"Bearer {ret_token}"}

    # Fetch initial unread count
    initial_unread = client.get("/api/v1/notifications/unread-count", headers=headers).json()["unread_count"]

    # Trigger a real application event: Stock adjustment that drops below threshold
    dash = client.get("/api/v1/retailer/dashboard", headers=headers).json()
    inv_list = client.get("/api/v1/retailer/inventory", headers=headers).json()["items"]
    assert len(inv_list) > 0
    target_inv = inv_list[0]

    # Adjust stock to 2 (below default threshold of 5)
    adj_res = client.post(
        f"/api/v1/retailer/inventory/{target_inv['id']}/adjust-stock",
        json={"new_quantity": 2, "reason": "Test Low Stock Alert", "expected_version": target_inv["version"]},
        headers=headers
    )
    assert adj_res.status_code == 200

    # Notification should now be generated
    notifs_res = client.get("/api/v1/notifications", headers=headers)
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    assert notifs["unread_count"] >= initial_unread

    # Check notification content
    low_stock_notif = next((n for n in notifs["items"] if n["notification_type"] == "LOW_STOCK"), None)
    assert low_stock_notif is not None
    assert low_stock_notif["is_read"] is False

    # Mark single notification as read
    mark_res = client.patch(f"/api/v1/notifications/{low_stock_notif['id']}/read", headers=headers)
    assert mark_res.status_code == 200
    assert mark_res.json()["is_read"] is True

    # Mark all as read
    mark_all = client.post("/api/v1/notifications/mark-all-read", headers=headers)
    assert mark_all.status_code == 200

    final_unread = client.get("/api/v1/notifications/unread-count", headers=headers).json()["unread_count"]
    assert final_unread == 0

    # Restore stock
    client.post(
        f"/api/v1/retailer/inventory/{target_inv['id']}/adjust-stock",
        json={"new_quantity": 25, "reason": "Restocked", "expected_version": adj_res.json()["version"]},
        headers=headers
    )

def test_notification_user_isolation(client):
    ret_token = get_retailer_token(client)
    headers_ret = {"Authorization": f"Bearer {ret_token}"}

    cust_token = get_customer_token(client)
    headers_cust = {"Authorization": f"Bearer {cust_token}"}

    # Fetch retailer notification
    ret_notifs = client.get("/api/v1/notifications", headers=headers_ret).json()["items"]
    if ret_notifs:
        target_id = ret_notifs[0]["id"]
        # Customer attempts to read retailer's notification -> Must be 404/Forbidden
        hack_res = client.patch(f"/api/v1/notifications/{target_id}/read", headers=headers_cust)
        assert hack_res.status_code == 404

# ==========================================
# Feature D: Bulk CSV Import & Export Tests
# ==========================================

def test_bulk_inventory_export(client):
    token = get_retailer_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/retailer/inventory/export", headers=headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    content = res.text
    assert "Product Name,Brand,Category,Bottle Size,Price,Stock Quantity" in content

def test_bulk_inventory_import_preview_validation(client):
    token = get_retailer_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch a valid product
    prods = client.get("/api/v1/products").json()["items"]
    valid_p = prods[0]

    # Construct test CSV with:
    # 1. Valid row
    # 2. Invalid price (< 0)
    # 3. Invalid stock quantity (< 0)
    # 4. Unknown product
    # 5. Duplicate row in CSV
    csv_data = f"""Product Name,Brand,Bottle Size,Price,Stock Quantity,Available,Low Stock Threshold,Product ID
{valid_p['name']},{valid_p['brand']},750ml,1450.00,40,TRUE,5,{valid_p['id']}
{valid_p['name']},{valid_p['brand']},375ml,-100.00,20,TRUE,5,{valid_p['id']}
{valid_p['name']},{valid_p['brand']},180ml,300.00,-5,TRUE,5,{valid_p['id']}
NonExistentSpiritsBrandX,FakeBrand,750ml,500.00,10,TRUE,5,invalid-uuid-12345
{valid_p['name']},{valid_p['brand']},750ml,1500.00,50,TRUE,5,{valid_p['id']}
"""
    res = client.post(
        "/api/v1/retailer/inventory/import/preview",
        json={"raw_csv": csv_data},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 5
    assert data["valid_rows"] == 1
    assert data["error_rows"] == 4

    rows = data["rows"]
    # Row 1 is valid
    assert rows[0]["status"] == "VALID"
    # Row 2 has negative price error
    assert rows[1]["status"] == "ERROR"
    assert any("Price must be greater than 0" in e for e in rows[1]["errors"])
    # Row 3 has negative stock error
    assert rows[2]["status"] == "ERROR"
    assert any("Stock quantity cannot be negative" in e for e in rows[2]["errors"])
    # Row 4 has unknown product error
    assert rows[3]["status"] == "ERROR"
    assert any("not found" in e for e in rows[3]["errors"])
    # Row 5 has duplicate SKU error
    assert rows[4]["status"] == "ERROR"
    assert any("Duplicate" in e for e in rows[4]["errors"])

def test_bulk_inventory_import_apply(client):
    token = get_retailer_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    prods = client.get("/api/v1/products").json()["items"]
    p = prods[0]

    apply_payload = {
        "items": [
            {
                "product_id": p["id"],
                "bottle_size": "750ml",
                "price": 2850.00,
                "stock_quantity": 42,
                "is_available": True,
                "low_stock_threshold": 5
            }
        ]
    }
    apply_res = client.post(
        "/api/v1/retailer/inventory/import/apply",
        json=apply_payload,
        headers=headers
    )
    assert apply_res.status_code == 200
    res_data = apply_res.json()
    assert res_data["total_processed"] == 1

    # Verify inventory was updated
    inv_res = client.get("/api/v1/retailer/inventory", headers=headers).json()
    updated_item = next((i for i in inv_res["items"] if i["product_id"] == p["id"] and i["bottle_size"] == "750ml"), None)
    assert updated_item is not None
    assert updated_item["stock_quantity"] == 42
    assert float(updated_item["price"]) == 2850.00

# ==========================================
# Feature E: Security and Production Readiness Tests
# ==========================================

def test_production_settings_validation():
    # Production with default/insecure secret must fail
    with pytest.raises(ValueError, match="Production requires a secure"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            JWT_SECRET_KEY="insecure_dev_key_telangana_alcomarket_secret_min_32_characters"
        )

    # Production with DEBUG=True must fail
    with pytest.raises(ValueError, match="DEBUG mode must be False"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=True,
            JWT_SECRET_KEY="a_very_secure_high_entropy_prod_secret_1234567890_!@#"
        )

    # Production with wildcard CORS must fail
    with pytest.raises(ValueError, match="Wildcard CORS origin"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            JWT_SECRET_KEY="a_very_secure_high_entropy_prod_secret_1234567890_!@#",
            CORS_ORIGINS=["*"]
        )

    # Valid production settings must succeed
    valid_prod = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        JWT_SECRET_KEY="a_very_secure_high_entropy_prod_secret_1234567890_!@#",
        CORS_ORIGINS=["https://alcodelivery.telangana.gov.in"]
    )
    assert valid_prod.ENVIRONMENT == "production"
    assert valid_prod.DEBUG is False

def test_unauthorized_role_access_blocked(client):
    cust_token = get_customer_token(client)
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # Customer attempts to access Admin dashboard -> 403 Forbidden
    res_admin = client.get("/api/v1/admin/dashboard", headers=cust_headers)
    assert res_admin.status_code == 403

    # Customer attempts to access Retailer dashboard -> 403 Forbidden
    res_ret = client.get("/api/v1/retailer/dashboard", headers=cust_headers)
    assert res_ret.status_code == 403

def test_order_creation_triggers_notifications(client):
    cust_token = get_customer_token(client)
    headers_cust = {"Authorization": f"Bearer {cust_token}"}
    ret_token = get_retailer_token(client)
    headers_ret = {"Authorization": f"Bearer {ret_token}"}

    # 1. Ensure customer cart has an in-stock item
    inv_res = client.get("/api/v1/retailer/inventory", headers=headers_ret)
    items = inv_res.json()["items"]
    in_stock_item = next(i for i in items if i["stock_quantity"] > 2)

    client.delete("/api/v1/cart", headers=headers_cust)
    add_cart = client.post("/api/v1/cart/items", json={
        "inventory_id": in_stock_item["id"],
        "quantity": 1
    }, headers=headers_cust)
    assert add_cart.status_code == 201

    # 2. Place simulated order
    order_res = client.post("/api/v1/test-orders", json={
        "simulate_payment_success": True,
        "customer_notes": "Test notification flow"
    }, headers=headers_cust)
    assert order_res.status_code == 201
    orders_data = order_res.json()
    assert len(orders_data) > 0
    created_order = orders_data[0]

    # 3. Customer should have an ORDER_UPDATE notification
    cust_notifs = client.get("/api/v1/notifications", headers=headers_cust).json()
    order_notif = next((n for n in cust_notifs["items"] if created_order["order_number"] in n["message"] or created_order["order_number"] in n["title"]), None)
    assert order_notif is not None, "Customer must receive notification for created order"
    assert order_notif["notification_type"] == "ORDER_UPDATE"

    # 4. Retailer should have received an incoming order notification
    ret_notifs = client.get("/api/v1/notifications", headers=headers_ret).json()
    ret_order_notif = next((n for n in ret_notifs["items"] if created_order["order_number"] in n["message"] or created_order["order_number"] in n["title"]), None)
    assert ret_order_notif is not None, "Retailer must receive notification for incoming order"

    # 5. When retailer confirms order, customer gets status update notification
    update_res = client.patch(
        f"/api/v1/retailer/orders/{created_order['id']}/status",
        json={"status": "confirmed", "notes": "Order accepted by store"},
        headers=headers_ret
    )
    assert update_res.status_code == 200

    cust_notifs_after = client.get("/api/v1/notifications", headers=headers_cust).json()
    status_notif = next((n for n in cust_notifs_after["items"] if created_order["order_number"] in n["message"] and "Confirmed" in n["title"]), None)
    assert status_notif is not None, "Customer must receive status update notification"
