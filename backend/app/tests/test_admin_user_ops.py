import pytest
import uuid

def test_admin_user_operations(client):
    # 1. Log in as Excise Admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@telanganaliquor.gov.mock",
        "password": "Admin@123456"
    })
    assert admin_login.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    admin_id = admin_login.json()["user_id"]

    # 2. Get all users
    users_res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 3

    # 3. Create a test customer to edit and delete
    test_email = f"user_to_edit_{uuid.uuid4().hex[:6]}@demo.com"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": "Password@123",
        "full_name": "Initial Name",
        "phone": "+91-9123456789",
        "role": "customer",
        "date_of_birth": "1997-01-01"
    })
    assert reg_res.status_code == 201
    target_id = reg_res.json()["id"]

    # 4. Admin updates user details (PATCH)
    patch_res = client.patch(f"/api/v1/admin/users/{target_id}", json={
        "full_name": "Updated Legal Name",
        "phone": "+91-9999988888",
        "is_active": True,
        "is_verified": True
    }, headers=admin_headers)
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["full_name"] == "Updated Legal Name"
    assert updated_data["phone"] == "+91-9999988888"
    assert updated_data["is_verified"] is True

    # 5. Non-admin customer cannot delete users (403 Forbidden)
    cust_login = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    cust_headers = {"Authorization": f"Bearer {cust_login.json()['access_token']}"}
    unauthorized_del = client.delete(f"/api/v1/admin/users/{target_id}", headers=cust_headers)
    assert unauthorized_del.status_code == 403

    # 6. Admin cannot delete their own active session
    self_del = client.delete(f"/api/v1/admin/users/{admin_id}", headers=admin_headers)
    assert self_del.status_code == 400
    assert "own active administrator account" in self_del.json()["detail"]

    # 7. Admin deletes user successfully
    del_res = client.delete(f"/api/v1/admin/users/{target_id}", headers=admin_headers)
    assert del_res.status_code == 200
    assert "successfully deleted" in del_res.json()["message"]

    # Verify user is gone
    users_after = client.get("/api/v1/admin/users", headers=admin_headers).json()
    assert not any(u["id"] == target_id for u in users_after)
