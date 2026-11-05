import uuid
from decimal import Decimal


def test_delivery_partner_login_and_profile(client):
    # 1. Login as default seeded delivery partner
    login_res = client.post("/api/v1/auth/login", json={
        "email": "partner@demo.com",
        "password": "Partner@123456"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get delivery profile
    prof_res = client.get("/api/v1/delivery/profile", headers=headers)
    assert prof_res.status_code == 200
    profile = prof_res.json()
    assert profile["email"] == "partner@demo.com"
    assert profile["is_online"] is True
    assert profile["vehicle_number"] != ""
    assert profile["is_verified"] is True
    assert "TS-EXCISE-DP" in profile["compliance_permit_no"]

    # 3. Update duty status & zone
    update_res = client.patch("/api/v1/delivery/status", json={
        "is_online": False,
        "current_zone": "Banjara Hills & Jubilee Hills"
    }, headers=headers)
    assert update_res.status_code == 200
    updated_prof = update_res.json()
    assert updated_prof["is_online"] is False
    assert updated_prof["current_zone"] == "Banjara Hills & Jubilee Hills"

    # Restore online status
    client.patch("/api/v1/delivery/status", json={"is_online": True}, headers=headers)


def test_delivery_partner_rbac_forbidden_for_other_roles(client):
    # Customer cannot access delivery endpoints
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    forbidden_profile = client.get("/api/v1/delivery/profile", headers=cust_headers)
    assert forbidden_profile.status_code == 403

    forbidden_available = client.get("/api/v1/delivery/available-orders", headers=cust_headers)
    assert forbidden_available.status_code == 403

    # Retailer cannot access delivery endpoints
    ret_login = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    ret_token = ret_login.json()["access_token"]
    ret_headers = {"Authorization": f"Bearer {ret_token}"}

    forbidden_ret_profile = client.get("/api/v1/delivery/profile", headers=ret_headers)
    assert forbidden_ret_profile.status_code == 403


def test_full_delivery_order_lifecycle(client):
    # 1. Customer creates an order
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    cat_res = client.get("/api/v1/products")
    p_id = cat_res.json()["items"][0]["id"]
    p_detail = client.get(f"/api/v1/products/{p_id}").json()
    inv_id = p_detail["inventories"][0]["id"]

    # Add to cart
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)

    # Checkout simulated order
    checkout_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert checkout_res.status_code == 201
    order_data = checkout_res.json()[0]
    order_id = order_data["id"]

    # 2. Retailer accepts & confirms order so it is ready for delivery pickup pool
    ret_login = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    ret_headers = {"Authorization": f"Bearer {ret_login.json()['access_token']}"}

    confirm_res = client.patch(
        f"/api/v1/retailer/orders/{order_id}/status",
        json={"status": "confirmed", "notes": "Order packed and waiting for delivery partner"},
        headers=ret_headers
    )
    assert confirm_res.status_code == 200

    # 3. Delivery partner fetches available orders
    dp_login = client.post("/api/v1/auth/login", json={
        "email": "partner@demo.com",
        "password": "Partner@123456"
    })
    dp_headers = {"Authorization": f"Bearer {dp_login.json()['access_token']}"}

    available_res = client.get("/api/v1/delivery/available-orders", headers=dp_headers)
    assert available_res.status_code == 200
    available_orders = available_res.json()
    target_in_pool = any(o["order_id"] == order_id for o in available_orders)
    assert target_in_pool is True

    # 4. Delivery partner accepts the order pickup
    accept_res = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] in ["ready", "confirmed"]

    # Active order query should now return this order
    active_res = client.get("/api/v1/delivery/active-order", headers=dp_headers)
    assert active_res.status_code == 200
    assert active_res.json() is not None
    assert active_res.json()["order_id"] == order_id

    # Attempting to accept another order while having an active order fails
    duplicate_accept = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert duplicate_accept.status_code == 200 # Re-accepting the same is idempotent

    # 5. Delivery partner confirms pickup at store counter
    pickup_res = client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)
    assert pickup_res.status_code == 200
    assert pickup_res.json()["status"] == "out_for_delivery"

    # 6. Complete delivery: Test statutory 21+ physical verification requirement
    # Attempt complete without age verification -> 400 Bad Request
    fail_age_res = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={
            "customer_age_verified": False,
            "id_proof_checked": True,
            "otp": "4821"
        },
        headers=dp_headers
    )
    assert fail_age_res.status_code == 400
    assert "Excise compliance" in fail_age_res.json()["detail"]

    # Attempt complete with wrong OTP -> 400 Bad Request
    fail_otp_res = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={
            "customer_age_verified": True,
            "id_proof_checked": True,
            "otp": "9999"
        },
        headers=dp_headers
    )
    assert fail_otp_res.status_code == 400
    assert "Invalid delivery verification OTP" in fail_otp_res.json()["detail"]

    # 7. Complete delivery with full statutory compliance and correct OTP
    delivery_otp = accept_res.json()["delivery_otp"] or "4821"
    complete_res = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={
            "customer_age_verified": True,
            "id_proof_checked": True,
            "id_proof_type": "Aadhaar / Voter ID",
            "otp": delivery_otp,
            "notes": "Verified government ID showing 28 years age"
        },
        headers=dp_headers
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

    # Verify active order is now cleared
    cleared_active = client.get("/api/v1/delivery/active-order", headers=dp_headers)
    assert cleared_active.status_code == 200
    assert cleared_active.json() is None

    # Verify earnings summary & trip history
    earnings_res = client.get("/api/v1/delivery/earnings", headers=dp_headers)
    assert earnings_res.status_code == 200
    earnings_data = earnings_res.json()
    assert float(earnings_data["today_earnings"]) > 0

    history_res = client.get("/api/v1/delivery/history", headers=dp_headers)
    assert history_res.status_code == 200
    history_orders = [h["order_id"] for h in history_res.json()]
    assert order_id in history_orders

