
def test_live_payment_strictly_blocked_by_compliance(client):
    # Direct attempt to trigger live payment endpoint
    res = client.post("/api/v1/orders/live-payment-attempt", json={
        "order_id": "test-order-id-123",
        "payment_method": "CARD",
        "amount": 2500.00
    })
    assert res.status_code == 403
    data = res.json()
    assert data["error"] == "LegalComplianceRestriction"
    assert data["code"] == "PAYMENT_GATEWAY_PROHIBITED"
    assert "Telangana Excise Act" in data["regulatory_context"]

def test_live_dispatch_strictly_blocked_by_compliance(client):
    # Direct attempt to trigger alcohol home delivery dispatch
    res = client.post("/api/v1/orders/live-dispatch-attempt")
    assert res.status_code == 403
    data = res.json()
    assert data["error"] == "LegalComplianceRestriction"
    assert data["code"] == "HOME_DELIVERY_PROHIBITED"

def test_compliance_status_disclosure(client):
    res = client.get("/api/v1/compliance-status")
    assert res.status_code == 200
    data = res.json()
    assert data["alcohol_transactions_enabled"] is False
    assert data["statutory_minimum_age"] == 21
    assert data["fail_closed_active"] is True
    assert "Telangana Excise Act, 1968" in data["governing_statute"]


def test_delivery_routes_reject_non_simulated_order_when_dispatch_disabled(client, db_session):
    from app.models.order import Order

    order = db_session.query(Order).filter(Order.order_number == "TS-ORD-2026-9041").one()
    original_simulation_flag = order.is_simulated
    order.is_simulated = False
    db_session.commit()
    try:
        login = client.post("/api/v1/auth/login", json={
            "email": "partner@demo.com", "password": "Partner@123456"
        })
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        available = client.get("/api/v1/delivery/available-orders", headers=headers)
        assert all(item["order_id"] != order.id for item in available.json())

        for action, payload in (
            ("accept", None),
            ("pickup", None),
            ("complete", {"customer_age_verified": True, "id_proof_checked": True, "otp": "4821"}),
        ):
            response = client.post(
                f"/api/v1/delivery/orders/{order.id}/{action}",
                json=payload,
                headers=headers,
            )
            assert response.status_code == 403
            assert response.json()["code"] == "HOME_DELIVERY_PROHIBITED"
    finally:
        order.is_simulated = original_simulation_flag
        db_session.commit()


def test_unverified_delivery_partner_cannot_see_customer_orders(client, db_session):
    import uuid

    from app.core.security import hash_password
    from app.models.user import User, UserRole

    email = f"unverified_partner_{uuid.uuid4().hex[:8]}@demo.mock"
    user = User(
        email=email, hashed_password=hash_password("Partner@123456"),
        full_name="Unverified Partner", role=UserRole.DELIVERY_PARTNER,
        is_active=True, is_verified=False,
    )
    db_session.add(user)
    db_session.commit()

    login = client.post("/api/v1/auth/login", json={"email": email, "password": "Partner@123456"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    profile = client.get("/api/v1/delivery/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["is_verified"] is False
    assert profile.json()["total_trips"] == 0
    assert client.get("/api/v1/delivery/available-orders", headers=headers).status_code == 403
    assert client.patch("/api/v1/delivery/status", json={"is_online": True}, headers=headers).status_code == 403
