import pytest


def test_catalog_search_and_filters(client):
    # Test search for "Amrut"
    res = client.get("/api/v1/products?search=Amrut")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) >= 1
    assert any("Amrut" in p["name"] for p in items)
    # Check default_inventory_id and inventories
    amrut_prod = next(p for p in items if "Amrut" in p["name"])
    assert amrut_prod["default_inventory_id"] is not None
    assert len(amrut_prod["inventories"]) >= 1

    # Test category filter "beer"
    res_beer = client.get("/api/v1/products?category=beer")
    assert res_beer.status_code == 200
    beer_items = res_beer.json()["items"]
    assert len(beer_items) >= 1
    for b in beer_items:
        assert b["category_slug"] == "beer"

    # Test sorting by price
    res_sort = client.get("/api/v1/products?sort_by=price_asc")
    assert res_sort.status_code == 200

def test_cart_and_simulated_checkout_flow(client):
    # 1. Login as customer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Clear cart
    client.delete("/api/v1/cart", headers=headers)

    # 3. Pick a product inventory
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    p_id = cat_res.json()["items"][0]["id"]
    p_detail = client.get(f"/api/v1/products/{p_id}").json()
    inv_id = p_detail["inventories"][0]["id"]
    inv_price = float(p_detail["inventories"][0]["price"])

    # 4. Add 2 units to cart
    add_res = client.post(
        "/api/v1/cart/items",
        json={"inventory_id": inv_id, "quantity": 2},
        headers=headers
    )
    assert add_res.status_code == 201
    cart_data = add_res.json()
    assert cart_data["item_count"] == 2
    assert float(cart_data["subtotal"]) == pytest.approx(inv_price * 2, 0.01)

    # 5. Execute simulated checkout
    checkout_res = client.post(
        "/api/v1/test-orders",
        json={
            "customer_notes": "Test simulated order for QA verification",
            "simulate_payment_success": True
        },
        headers=headers
    )
    assert checkout_res.status_code == 201
    orders = checkout_res.json()
    assert len(orders) >= 1
    test_order = orders[0]
    assert test_order["is_simulated"] is True
    assert test_order["status"] == "created"
    assert test_order["payment_status"] == "SUCCESS"
    assert "SIM-TS-" in test_order["order_number"]

    # 6. Verify cart is now empty after checkout
    cart_after = client.get("/api/v1/cart", headers=headers).json()
    assert cart_after["item_count"] == 0

def test_order_status_state_transitions(client):
    # Login as retailer 1
    ret_login = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    ret_token = ret_login.json()["access_token"]
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    # Create an order
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    cat_res = client.get("/api/v1/products?search=Amrut")
    inv_id = client.get(f"/api/v1/products/{cat_res.json()['items'][0]['id']}").json()["inventories"][0]["id"]
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)
    orders = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers).json()
    order_id = orders[0]["id"]

    # Retailer transitions: CREATED -> CONFIRMED
    res1 = client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)
    assert res1.status_code == 200
    assert res1.json()["status"] == "confirmed"

    # Retailer transitions: CONFIRMED -> PREPARING
    res2 = client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "preparing"}, headers=ret_headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "preparing"

    # Invalid jump: PREPARING -> COMPLETED (must go to READY first)
    res_bad = client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "completed"}, headers=ret_headers)
    assert res_bad.status_code == 400
    assert "Invalid order transition" in res_bad.json()["detail"]

def test_checkout_revalidates_unavailable_listing_and_suspended_retailer(client):
    # 1. Login as customer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Clear cart
    client.delete("/api/v1/cart", headers=cust_headers)

    # Pick a product inventory from Retailer 1 (Madhapur)
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    p_id = cat_res.json()["items"][0]["id"]
    p_detail = client.get(f"/api/v1/products/{p_id}").json()
    inv_obj = p_detail["inventories"][0]
    inv_id = inv_obj["id"]
    retailer_id = inv_obj["retailer_id"]

    # Add to cart
    add_res = client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)
    assert add_res.status_code == 201

    # Login as retailer to toggle listing availability
    ret_login = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    ret_headers = {"Authorization": f"Bearer {ret_login.json()['access_token']}"}

    # Deactivate inventory listing (is_available = False)
    patch_inv = client.patch(f"/api/v1/retailer/inventory/{inv_id}", json={"is_available": False}, headers=ret_headers)
    assert patch_inv.status_code == 200
    assert patch_inv.json()["is_available"] is False

    # Attempt simulated checkout -> MUST FAIL (400 Bad Request)
    fail_checkout_1 = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert fail_checkout_1.status_code == 400
    assert "unavailable" in fail_checkout_1.json()["detail"].lower()

    # Restore listing availability
    restore_inv = client.patch(f"/api/v1/retailer/inventory/{inv_id}", json={"is_available": True}, headers=ret_headers)
    assert restore_inv.status_code == 200

    # Admin suspends retailer
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    suspend_res = client.patch(f"/api/v1/admin/retailers/{retailer_id}/review", json={
        "status": "suspended",
        "review_notes": "Temporary audit suspension"
    }, headers=admin_headers)
    assert suspend_res.status_code == 200
    assert suspend_res.json()["status"] == "suspended"

    # Attempt simulated checkout -> MUST FAIL because retailer is suspended (400 Bad Request)
    fail_checkout_2 = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert fail_checkout_2.status_code == 400
    assert "not approved" in fail_checkout_2.json()["detail"].lower()

    # Re-approve retailer and restore inventory
    approve_res = client.patch(f"/api/v1/admin/retailers/{retailer_id}/review", json={
        "status": "approved",
        "review_notes": "Restored after audit",
        "verify_license": True
    }, headers=admin_headers)
    assert approve_res.status_code == 200

    # Ensure inventory item is available
    client.patch(f"/api/v1/retailer/inventory/{inv_id}", json={"is_available": True}, headers=ret_headers)

    # Now checkout succeeds
    success_checkout = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert success_checkout.status_code == 201
    assert len(success_checkout.json()) >= 1
