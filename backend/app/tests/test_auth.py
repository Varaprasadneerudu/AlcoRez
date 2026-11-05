import uuid


def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "customer"
    assert data["email"] == "customer@demo.com"

def test_login_invalid_password(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "WrongPassword!999"
    })
    assert response.status_code == 401

def test_customer_registration_under_21_fails(client):
    # Under Telangana Excise Act, minimum age is 21
    unique_email = f"minor_{uuid.uuid4().hex[:6]}@demo.com"
    response = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password@123",
        "full_name": "Underage User",
        "role": "customer",
        "date_of_birth": "2010-05-10" # 16 years old
    })
    assert response.status_code == 400
    assert "21 years of age" in response.json()["detail"]

def test_customer_registration_valid_age(client):
    unique_email = f"adult_{uuid.uuid4().hex[:6]}@demo.com"
    response = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password@123",
        "full_name": "Adult User",
        "role": "customer",
        "date_of_birth": "1998-05-10" # 28 years old
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == unique_email
    assert data["is_verified"] is True

def test_token_refresh(client):
    login_res = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    refresh_token = login_res.json()["refresh_token"]

    refresh_res = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()

def test_public_registration_of_non_customer_roles_forbidden(client):
    # Attempting to register as retailer publicly must be rejected
    res_retailer = client.post("/api/v1/auth/register", json={
        "email": f"malicious_retailer_{uuid.uuid4().hex[:6]}@demo.com",
        "password": "Password@123",
        "full_name": "Retailer Infiltrator",
        "role": "retailer"
    })
    assert res_retailer.status_code == 403
    assert "prohibited" in res_retailer.json()["detail"].lower()

    # Attempting to register as admin publicly must be rejected
    res_admin = client.post("/api/v1/auth/register", json={
        "email": f"malicious_admin_{uuid.uuid4().hex[:6]}@demo.com",
        "password": "Password@123",
        "full_name": "Admin Infiltrator",
        "role": "admin"
    })
    assert res_admin.status_code == 403
    assert "prohibited" in res_admin.json()["detail"].lower()
