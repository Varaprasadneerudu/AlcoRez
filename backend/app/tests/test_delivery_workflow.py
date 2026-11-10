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
    customer_otp = order_data["delivery_otp"]
    assert customer_otp is not None

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

    # 4. Delivery partner accepts the order pickup - verify delivery_otp is NOT exposed
    accept_res = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] in ["ready", "confirmed"]
    assert "delivery_otp" not in accept_res.json()

    # Active order query should now return this order - verify delivery_otp is NOT exposed
    active_res = client.get("/api/v1/delivery/active-order", headers=dp_headers)
    assert active_res.status_code == 200
    assert active_res.json() is not None
    assert active_res.json()["order_id"] == order_id
    assert "delivery_otp" not in active_res.json()

    # Attempting to re-accept the same order is idempotent
    duplicate_accept = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert duplicate_accept.status_code == 200

    # 5. Delivery partner confirms pickup at store counter
    pickup_res = client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)
    assert pickup_res.status_code == 200
    assert pickup_res.json()["status"] == "out_for_delivery"
    assert "delivery_otp" not in pickup_res.json()

    # 6. Complete delivery: Test statutory 21+ physical verification requirement
    fail_age_res = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={
            "customer_age_verified": False,
            "id_proof_checked": True,
            "otp": customer_otp
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
            "otp": "000000"
        },
        headers=dp_headers
    )
    assert fail_otp_res.status_code == 400
    assert "Invalid delivery verification OTP." in fail_otp_res.json()["detail"]

    # 7. Complete delivery with full statutory compliance and correct customer OTP
    complete_res = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={
            "customer_age_verified": True,
            "id_proof_checked": True,
            "id_proof_type": "Aadhaar / Voter ID",
            "otp": customer_otp,
            "notes": "Verified government ID showing 28 years age"
        },
        headers=dp_headers
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"
    assert "delivery_otp" not in complete_res.json()

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


def test_delivery_otp_security_and_strict_verification(client):
    """
    Regression Test for Bug 1:
    - Delivery OTP is never exposed in partner-facing responses (available, active, accept, pickup, complete).
    - Hardcoded fallback codes (e.g. 4821, 1234) are rejected when actual OTP is different.
    - Validation error message strictly hides the expected OTP.
    - Verification requires the order's actual OTP.
    """
    # 1. Customer creates an order
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    client.delete("/api/v1/cart", headers=cust_headers)
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    inv_id = client.get(f"/api/v1/products/{cat_res.json()['items'][0]['id']}").json()["inventories"][0]["id"]
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)

    checkout_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert checkout_res.status_code == 201
    order_data = checkout_res.json()[0]
    order_id = order_data["id"]
    actual_otp = order_data["delivery_otp"]
    assert actual_otp is not None and len(actual_otp) in (4, 6)

    # 2. Retailer confirms order
    ret_login = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    ret_headers = {"Authorization": f"Bearer {ret_login.json()['access_token']}"}
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)

    # 3. Delivery partner flow
    dp_login = client.post("/api/v1/auth/login", json={
        "email": "partner@demo.com",
        "password": "Partner@123456"
    })
    dp_headers = {"Authorization": f"Bearer {dp_login.json()['access_token']}"}

    # Verify available-orders does NOT contain delivery_otp
    avail_res = client.get("/api/v1/delivery/available-orders", headers=dp_headers)
    assert avail_res.status_code == 200
    for order_entry in avail_res.json():
        assert "delivery_otp" not in order_entry

    # Accept order
    accept_res = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert accept_res.status_code == 200
    assert "delivery_otp" not in accept_res.json()

    # Active order does NOT contain delivery_otp
    active_res = client.get("/api/v1/delivery/active-order", headers=dp_headers)
    assert active_res.status_code == 200
    assert "delivery_otp" not in active_res.json()

    # Pickup order
    pickup_res = client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)
    assert pickup_res.status_code == 200
    assert "delivery_otp" not in pickup_res.json()

    # 4. Attempt completion with hardcoded fallback OTP '4821' (assuming actual_otp is not 4821)
    if actual_otp != "4821":
        fail_4821 = client.post(
            f"/api/v1/delivery/orders/{order_id}/complete",
            json={"customer_age_verified": True, "id_proof_checked": True, "otp": "4821"},
            headers=dp_headers
        )
        assert fail_4821.status_code == 400
        assert fail_4821.json()["detail"] == "Invalid delivery verification OTP."
        assert actual_otp not in fail_4821.json()["detail"]

    # 5. Attempt completion with hardcoded fallback OTP '1234'
    if actual_otp != "1234":
        fail_1234 = client.post(
            f"/api/v1/delivery/orders/{order_id}/complete",
            json={"customer_age_verified": True, "id_proof_checked": True, "otp": "1234"},
            headers=dp_headers
        )
        assert fail_1234.status_code == 400
        assert fail_1234.json()["detail"] == "Invalid delivery verification OTP."
        assert actual_otp not in fail_1234.json()["detail"]

    # 6. Complete with actual OTP succeeds
    success_comp = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={"customer_age_verified": True, "id_proof_checked": True, "otp": actual_otp},
        headers=dp_headers
    )
    assert success_comp.status_code == 200
    assert success_comp.json()["status"] == "completed"
    assert "delivery_otp" not in success_comp.json()


def test_delivery_completion_repeated_request_safe_idempotent(client):
    """
    Regression Test for Bug 2:
    - Repeating delivery completion request returns completed order safely.
    - Does NOT duplicate trip count or credit earnings again.
    """
    # 1. Customer creates order
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    client.delete("/api/v1/cart", headers=cust_headers)
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    inv_id = client.get(f"/api/v1/products/{cat_res.json()['items'][0]['id']}").json()["inventories"][0]["id"]
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)

    checkout_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    order_data = checkout_res.json()[0]
    order_id = order_data["id"]
    actual_otp = order_data["delivery_otp"]

    # 2. Retailer confirms order
    ret_login = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    ret_headers = {"Authorization": f"Bearer {ret_login.json()['access_token']}"}
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)

    # 3. Delivery partner accepts and picks up
    dp_login = client.post("/api/v1/auth/login", json={
        "email": "partner@demo.com",
        "password": "Partner@123456"
    })
    dp_headers = {"Authorization": f"Bearer {dp_login.json()['access_token']}"}

    client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)

    # 4. First completion request
    comp_1 = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={"customer_age_verified": True, "id_proof_checked": True, "otp": actual_otp},
        headers=dp_headers
    )
    assert comp_1.status_code == 200
    assert comp_1.json()["status"] == "completed"

    earnings_1 = client.get("/api/v1/delivery/earnings", headers=dp_headers).json()
    trips_after_first = earnings_1["today_trips"]
    today_earnings_after_first = float(earnings_1["today_earnings"])
    total_trips_after_first = earnings_1["total_trips"]
    total_earnings_after_first = float(earnings_1["total_earnings"])

    # 5. Repeated completion request (simulating network retry / re-submit)
    comp_2 = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={"customer_age_verified": True, "id_proof_checked": True, "otp": actual_otp},
        headers=dp_headers
    )
    assert comp_2.status_code == 200
    assert comp_2.json()["status"] == "completed"

    # Verify trip count and earnings were NOT incremented a second time
    earnings_2 = client.get("/api/v1/delivery/earnings", headers=dp_headers).json()
    assert earnings_2["today_trips"] == trips_after_first
    assert float(earnings_2["today_earnings"]) == today_earnings_after_first
    assert earnings_2["total_trips"] == total_trips_after_first
    assert float(earnings_2["total_earnings"]) == total_earnings_after_first


def test_delivery_status_transitions_and_cancelled_orders_enforced(client):
    """
    Regression Test for Bug 3:
    - Enforces valid order status transitions and assignment checks for accept, pickup, complete.
    - Handles cancelled orders properly at every stage.
    """
    # 1. Customer creates an order (status = CREATED)
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    client.delete("/api/v1/cart", headers=cust_headers)
    cat_res = client.get("/api/v1/products?search=Kingfisher")
    inv_id = client.get(f"/api/v1/products/{cat_res.json()['items'][0]['id']}").json()["inventories"][0]["id"]
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)
    orders = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers).json()
    order_id = orders[0]["id"]

    dp_login = client.post("/api/v1/auth/login", json={
        "email": "partner@demo.com",
        "password": "Partner@123456"
    })
    dp_headers = {"Authorization": f"Bearer {dp_login.json()['access_token']}"}

    # Cannot accept order in CREATED status before retailer confirmation
    fail_accept_created = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert fail_accept_created.status_code == 400
    assert "confirmed by retailer" in fail_accept_created.json()["detail"].lower()

    # Retailer confirms order -> CONFIRMED
    ret_login = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    ret_headers = {"Authorization": f"Bearer {ret_login.json()['access_token']}"}
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)

    # Cannot pickup order without accepting first (unassigned)
    fail_pickup_unassigned = client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)
    assert fail_pickup_unassigned.status_code == 403
    assert "not assigned" in fail_pickup_unassigned.json()["detail"].lower()

    # Now retailer cancels the order
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "cancelled"}, headers=ret_headers)

    # Cannot accept a cancelled order
    fail_accept_cancelled = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert fail_accept_cancelled.status_code == 400
    assert "cancelled" in fail_accept_cancelled.json()["detail"].lower()

    # Cannot pickup a cancelled order
    fail_pickup_cancelled = client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)
    assert fail_pickup_cancelled.status_code == 403 or fail_pickup_cancelled.status_code == 400

    # Cannot complete a cancelled order
    fail_complete_cancelled = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={"customer_age_verified": True, "id_proof_checked": True, "otp": "9999"},
        headers=dp_headers
    )
    assert fail_complete_cancelled.status_code == 403 or fail_complete_cancelled.status_code == 400


def test_customer_handover_otp_end_to_end(client):
    """
    Verify customer OTP generation and delivery partner doorstep handover verification:
    1. Simulated checkout produces a 4-digit customer delivery OTP.
    2. Customer retrieves order details and views the actual delivery OTP.
    3. Delivery partner portal does not expose the OTP.
    4. Delivery partner entry of the customer-provided OTP successfully completes the order.
    5. Invalid OTPs are strictly rejected without leakage.
    6. Legacy deterministic order-number hash code is supported for orders where the client showed it.
    """
    # 1. Customer places order
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}

    cat_res = client.get("/api/v1/products")
    p_id = cat_res.json()["items"][0]["id"]
    p_detail = client.get(f"/api/v1/products/{p_id}").json()
    inv_id = p_detail["inventories"][0]["id"]
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)

    checkout_res = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers)
    assert checkout_res.status_code == 201
    order_data = checkout_res.json()[0]
    order_id = order_data["id"]
    order_num = order_data["order_number"]
    assert order_num.startswith("SIM-TS-")
    customer_otp = order_data["delivery_otp"]

    # Customer OTP must be 4 digits
    assert customer_otp is not None and len(customer_otp) == 4

    # Customer queries order - receives the OTP
    order_detail = client.get(f"/api/v1/orders/{order_id}", headers=cust_headers)
    assert order_detail.status_code == 200
    assert order_detail.json()["delivery_otp"] == customer_otp

    # 2. Retailer transitions order to READY
    ret_login = client.post("/api/v1/auth/login", json={
        "email": "retailer@madhapurwines.mock",
        "password": "Retailer@123456"
    })
    ret_headers = {"Authorization": f"Bearer {ret_login.json()['access_token']}"}
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "confirmed"}, headers=ret_headers)
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "preparing"}, headers=ret_headers)
    client.patch(f"/api/v1/retailer/orders/{order_id}/status", json={"status": "ready"}, headers=ret_headers)

    # 3. Delivery partner accepts and picks up
    dp_login = client.post("/api/v1/auth/login", json={
        "email": "partner@demo.com",
        "password": "Partner@123456"
    })
    dp_headers = {"Authorization": f"Bearer {dp_login.json()['access_token']}"}

    accept_res = client.post(f"/api/v1/delivery/orders/{order_id}/accept", headers=dp_headers)
    assert accept_res.status_code == 200
    assert "delivery_otp" not in accept_res.json()

    pickup_res = client.post(f"/api/v1/delivery/orders/{order_id}/pickup", headers=dp_headers)
    assert pickup_res.status_code == 200
    assert pickup_res.json()["status"] == "out_for_delivery"

    # 4. Attempt invalid OTPs
    for wrong_otp in ["0000", "999999", "ABCD"]:
        if wrong_otp != customer_otp:
            bad_res = client.post(
                f"/api/v1/delivery/orders/{order_id}/complete",
                json={"customer_age_verified": True, "id_proof_checked": True, "otp": wrong_otp},
                headers=dp_headers
            )
            assert bad_res.status_code == 400
            assert bad_res.json()["detail"] == "Invalid delivery verification OTP."
            assert customer_otp not in bad_res.json()["detail"]

    # 5. Delivery partner enters the customer's actual OTP
    complete_res = client.post(
        f"/api/v1/delivery/orders/{order_id}/complete",
        json={"customer_age_verified": True, "id_proof_checked": True, "otp": customer_otp},
        headers=dp_headers
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"
    assert "delivery_otp" not in complete_res.json()

    # 6. Verify delivery OTP security: calculated code cannot complete a new order with random OTP,
    # and safe migration path allows calculated code for legacy orders without OTP.
    client.post("/api/v1/cart/items", json={"inventory_id": inv_id, "quantity": 1}, headers=cust_headers)
    legacy_order = client.post("/api/v1/test-orders", json={"simulate_payment_success": True}, headers=cust_headers).json()[0]
    legacy_id = legacy_order["id"]
    legacy_num = legacy_order["order_number"]
    actual_order_otp = legacy_order["delivery_otp"]
    computed_legacy_otp = str(abs(sum(ord(c) for c in legacy_num) or 4892) % 9000 + 1000)

    client.patch(f"/api/v1/retailer/orders/{legacy_id}/status", json={"status": "confirmed"}, headers=ret_headers)
    client.patch(f"/api/v1/retailer/orders/{legacy_id}/status", json={"status": "ready"}, headers=ret_headers)
    client.post(f"/api/v1/delivery/orders/{legacy_id}/accept", headers=dp_headers)
    client.post(f"/api/v1/delivery/orders/{legacy_id}/pickup", headers=dp_headers)

    # If the computed legacy code differs from the order's actual random OTP, it must be rejected!
    if computed_legacy_otp != actual_order_otp:
        bad_calc_res = client.post(
            f"/api/v1/delivery/orders/{legacy_id}/complete",
            json={"customer_age_verified": True, "id_proof_checked": True, "otp": computed_legacy_otp},
            headers=dp_headers
        )
        assert bad_calc_res.status_code == 400
        assert bad_calc_res.json()["detail"] == "Invalid delivery verification OTP."

    # Explicit migration path: simulate a legacy order where delivery_otp is None/empty
    from app.models.order import Order as OrderModel
    from app.tests.conftest import TestSessionLocal
    with TestSessionLocal() as session:
        ord_db = session.query(OrderModel).filter(OrderModel.id == legacy_id).first()
        ord_db.delivery_otp = None
        session.commit()

    legacy_complete_res = client.post(
        f"/api/v1/delivery/orders/{legacy_id}/complete",
        json={"customer_age_verified": True, "id_proof_checked": True, "otp": computed_legacy_otp},
        headers=dp_headers
    )
    assert legacy_complete_res.status_code == 200
    assert legacy_complete_res.json()["status"] == "completed"

    with TestSessionLocal() as session:
        migrated = session.query(OrderModel).filter(OrderModel.id == legacy_id).first()
        assert migrated.delivery_otp == computed_legacy_otp

