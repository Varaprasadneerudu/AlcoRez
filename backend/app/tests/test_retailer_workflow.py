import pytest
import uuid

def test_retailer_onboarding_and_admin_approval_workflow(client):
    # 1. Register a new user with retailer role
    r_email = f"retailer_applicant_{uuid.uuid4().hex[:6]}@demo.mock"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": r_email,
        "password": "Retailer@123456",
        "full_name": "Applicant Shop Owner",
        "role": "retailer"
    })
    assert reg_res.status_code == 201

    login_res = client.post("/api/v1/auth/login", json={
        "email": r_email,
        "password": "Retailer@123456"
    })
    r_token = login_res.json()["access_token"]
    r_headers = {"Authorization": f"Bearer {r_token}"}

    # 2. Submit onboarding application with license
    lic_num = f"TS-HYD-A4-{uuid.uuid4().hex[:6].upper()}"
    app_res = client.post("/api/v1/retailer/applications", json={
        "shop_name": "Banjara Hills Cellar Walk",
        "contact_person": "Applicant Shop Owner",
        "phone": "+91-9876500000",
        "email": r_email,
        "address_line": "Road 10, Banjara Hills",
        "city": "Hyderabad",
        "state": "Telangana",
        "postal_code": "500034",
        "license_number": lic_num,
        "license_type": "A4 Retail Wine Shop",
        "issuing_authority": "Prohibition & Excise Department, Govt of Telangana",
        "issued_date": "2024-04-01",
        "expiry_date": "2027-03-31",
        "document_url": "https://mock-storage.telangana.gov/licenses/test.pdf"
    }, headers=r_headers)
    assert app_res.status_code == 201
    app_data = app_res.json()
    assert app_data["status"] == "pending_review"
    assert app_data["license"]["is_verified"] is False
    retailer_id = app_data["id"]

    # 3. Unapproved retailer tries to add inventory -> Rejected!
    cat_res = client.get("/api/v1/products")
    p_id = cat_res.json()["items"][0]["id"]
    unapproved_inv = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 2500.00,
        "stock_quantity": 10
    }, headers=r_headers)
    assert unapproved_inv.status_code == 403
    assert "Only approved licensed retailers" in unapproved_inv.json()["detail"]

    # 4. Admin logs in and inspects pending retailers
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    pending_res = client.get("/api/v1/admin/retailers/pending", headers=admin_headers)
    assert pending_res.status_code == 200
    pending_ids = [r["id"] for r in pending_res.json()]
    assert retailer_id in pending_ids

    # 5. Admin approves retailer and verifies license
    review_res = client.patch(
        f"/api/v1/admin/retailers/{retailer_id}/review",
        json={
            "status": "approved",
            "review_notes": "Physically inspected premises and verified against state excise portal.",
            "verify_license": True
        },
        headers=admin_headers
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "approved"
    assert review_res.json()["license"]["is_verified"] is True

    # 6. Now approved retailer can add inventory!
    inv_res = client.post("/api/v1/retailer/inventory", json={
        "product_id": p_id,
        "bottle_size": "750ml",
        "price": 2500.00,
        "stock_quantity": 15
    }, headers=r_headers)
    assert inv_res.status_code == 201
    assert inv_res.json()["stock_quantity"] == 15

def test_create_retailer_linked_to_existing_store(client):
    # 1. Get existing approved stores
    retailers_res = client.get("/api/v1/retailers")
    assert retailers_res.status_code == 200
    existing_stores = retailers_res.json()
    assert len(existing_stores) > 0
    target_store = existing_stores[0]

    # 2. Register a new retailer with retailer_id specified
    new_email = f"staff_{uuid.uuid4().hex[:6]}@store.com"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": new_email,
        "password": "Password@123",
        "full_name": "Store Associate",
        "phone": "+91-9876543211",
        "role": "retailer",
        "retailer_id": target_store["id"]
    })
    assert reg_res.status_code == 201

    # 3. Log in as this new retailer
    login_res = client.post("/api/v1/auth/login", json={
        "email": new_email,
        "password": "Password@123"
    })
    assert login_res.status_code == 200
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # 4. Access retailer dashboard - should link directly to target_store!
    dash_res = client.get("/api/v1/retailer/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert dash_res.json()["retailer"]["id"] == target_store["id"]
    assert dash_res.json()["retailer"]["shop_name"] == target_store["shop_name"]
