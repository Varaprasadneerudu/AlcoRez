import pytest

def test_catalog_search_and_filters(client):
    # Test search for "Amrut"
    res = client.get("/api/v1/products?search=Amrut")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) >= 1
    assert any("Amrut" in p["name"] for p in items)

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
    # Login as admin to manage order
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

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
