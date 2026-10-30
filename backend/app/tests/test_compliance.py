
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
