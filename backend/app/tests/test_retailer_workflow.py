import uuid


def test_retailer_onboarding_and_admin_approval_workflow(client):
    # 1. Admin provisions a new retailer applicant user
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    r_email = f"retailer_applicant_{uuid.uuid4().hex[:6]}@demo.mock"
    reg_res = client.post("/api/v1/admin/users", json={
        "email": r_email,
        "password": "Retailer@123456",
        "full_name": "Applicant Shop Owner",
        "role": "retailer",
        "is_verified": True
    }, headers=admin_headers)
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

    # 2. Admin provisions a new retailer user linked to target_store
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    new_email = f"staff_{uuid.uuid4().hex[:6]}@store.com"
    reg_res = client.post("/api/v1/admin/users", json={
        "email": new_email,
        "password": "Password@123",
        "full_name": "Store Associate",
        "phone": "+91-9876543211",
        "role": "retailer",
        "retailer_id": target_store["id"],
        "is_verified": True
    }, headers=admin_headers)
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


def test_duplicate_retailer_application_rejected(client):
    # Register user
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    email = f"dup_applicant_{uuid.uuid4().hex[:6]}@demo.mock"
    client.post("/api/v1/admin/users", json={
        "email": email,
        "password": "Password@123",
        "full_name": "Duplicate Tester",
        "role": "retailer",
        "is_verified": True
    }, headers=admin_headers)
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "Password@123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to apply with an already existing shop name and city (case-insensitive test)
    # 'Madhapur Premium Wines & Spirits' is seeded in Hyderabad
    res = client.post("/api/v1/retailer/applications", json={
        "shop_name": "madhapur premium wines & spirits",
        "contact_person": "Duplicate Tester",
        "phone": "+91-9988776655",
        "email": email,
        "address_line": "Hitech City Road",
        "city": "hyderabad",
        "state": "Telangana",
        "postal_code": "500081",
        "license_number": f"TS-DUP-{uuid.uuid4().hex[:6].upper()}",
        "license_type": "A4 Retail Wine Shop",
        "issuing_authority": "Prohibition & Excise Department, Govt of Telangana",
        "issued_date": "2024-04-01",
        "expiry_date": "2027-03-31",
        "document_url": "https://mock-storage.telangana.gov/licenses/dup.pdf"
    }, headers=headers)

    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


def test_suspended_store_hidden_from_customer(client):
    # 1. Register retailer
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    email = f"suspend_owner_{uuid.uuid4().hex[:6]}@demo.mock"
    client.post("/api/v1/admin/users", json={
        "email": email,
        "password": "Password@123",
        "full_name": "Suspendable Owner",
        "role": "retailer",
        "is_verified": True
    }, headers=admin_headers)
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "Password@123"})
    token = login_res.json()["access_token"]
    r_headers = {"Authorization": f"Bearer {token}"}

    # 2. Apply with unique store name
    unique_shop = f"Kondapur Cellars {uuid.uuid4().hex[:6]}"
    app_res = client.post("/api/v1/retailer/applications", json={
        "shop_name": unique_shop,
        "contact_person": "Suspendable Owner",
        "phone": "+91-9123456789",
        "email": email,
        "address_line": "Kondapur Main Road",
        "city": "Hyderabad",
        "state": "Telangana",
        "postal_code": "500084",
        "license_number": f"TS-KON-{uuid.uuid4().hex[:6].upper()}",
        "license_type": "A4 Retail Wine Shop",
        "issuing_authority": "Prohibition & Excise Department, Govt of Telangana",
        "issued_date": "2024-04-01",
        "expiry_date": "2027-03-31",
        "document_url": "https://mock-storage.telangana.gov/licenses/kon.pdf"
    }, headers=r_headers)
    assert app_res.status_code == 201
    retailer_id = app_res.json()["id"]

    # 3. Admin logs in and approves
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    client.patch(
        f"/api/v1/admin/retailers/{retailer_id}/review",
        json={"status": "approved", "review_notes": "Valid test store", "verify_license": True},
        headers=admin_headers
    )

    # 4. Retailer adds inventory
    cat_res = client.get("/api/v1/products")
    product_id = cat_res.json()["items"][0]["id"]
    inv_res = client.post("/api/v1/retailer/inventory", json={
        "product_id": product_id,
        "bottle_size": "750ml",
        "price": 3200.00,
        "stock_quantity": 25
    }, headers=r_headers)
    assert inv_res.status_code == 201
    inv_id = inv_res.json()["id"]

    # 5. Customer can see store and its offers
    store_res = client.get(f"/api/v1/retailers/{retailer_id}")
    assert store_res.status_code == 200
    assert store_res.json()["shop_name"] == unique_shop

    list_res = client.get("/api/v1/retailers")
    assert any(r["id"] == retailer_id for r in list_res.json())

    # 6. Admin SUSPENDS the retailer
    suspend_res = client.patch(
        f"/api/v1/admin/retailers/{retailer_id}/review",
        json={"status": "suspended", "review_notes": "Violation of excise guidelines"},
        headers=admin_headers
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["status"] == "suspended"
    assert suspend_res.json()["license"]["is_verified"] is False

    # 7. Customer views MUST NOT show the suspended store
    hidden_store_res = client.get(f"/api/v1/retailers/{retailer_id}")
    assert hidden_store_res.status_code == 404

    refreshed_list = client.get("/api/v1/retailers")
    assert not any(r["id"] == retailer_id for r in refreshed_list.json())

    # 8. Check inventory item is marked unavailable
    my_inv = client.get("/api/v1/retailer/inventory", headers=r_headers)
    items = my_inv.json()["items"]
    item = next(i for i in items if i["id"] == inv_id)
    assert item["is_available"] is False

