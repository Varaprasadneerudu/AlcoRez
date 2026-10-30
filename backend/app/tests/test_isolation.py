import uuid


def test_retailer_cannot_modify_other_retailer_inventory(client):
    # Log in as Retailer 2 (Jubilee Hills)
    login_r2 = client.post("/api/v1/auth/login", json={
        "email": "retailer@jubileewines.mock",
        "password": "Retailer@123456"
    })
    token_r2 = login_r2.json()["access_token"]
    headers_r2 = {"Authorization": f"Bearer {token_r2}"}

    # Fetch Retailer 1 (Madhapur) inventory via public catalog
    cat_res = client.get("/api/v1/products")
    p_id = cat_res.json()["items"][0]["id"]
    p_detail = client.get(f"/api/v1/products/{p_id}").json()

    # Find an inventory item owned by Retailer 1
    r1_inv = None
    for inv in p_detail["inventories"]:
        if "Madhapur" in inv["retailer_shop_name"]:
            r1_inv = inv
            break
    assert r1_inv is not None

    # Retailer 2 attempts to update Retailer 1's inventory price
    patch_res = client.patch(
        f"/api/v1/retailer/inventory/{r1_inv['id']}",
        json={"price": 9999.00},
        headers=headers_r2
    )
    # Must be forbidden!
    assert patch_res.status_code == 403
    assert "Retailers can only modify their own inventory" in patch_res.json()["detail"]

def test_customer_cannot_access_other_customer_cart_or_address(client):
    # Customer 1
    login_c1 = client.post("/api/v1/auth/login", json={
        "email": "customer@demo.com",
        "password": "Customer@123456"
    })
    token_c1 = login_c1.json()["access_token"]
    headers_c1 = {"Authorization": f"Bearer {token_c1}"}

    # Customer 2 (register fresh with unique email)
    c2_email = f"another_{uuid.uuid4().hex[:6]}@demo.com"
    reg_c2 = client.post("/api/v1/auth/register", json={
        "email": c2_email,
        "password": "Password@123",
        "full_name": "Another User",
        "date_of_birth": "1990-01-01"
    })
    assert reg_c2.status_code == 201
    login_c2 = client.post("/api/v1/auth/login", json={
        "email": c2_email,
        "password": "Password@123"
    })
    token_c2 = login_c2.json()["access_token"]
    headers_c2 = {"Authorization": f"Bearer {token_c2}"}

    # Customer 1 adds item to cart
    cat_res = client.get("/api/v1/products")
    p_id = cat_res.json()["items"][0]["id"]
    p_detail = client.get(f"/api/v1/products/{p_id}").json()
    inv_id = p_detail["inventories"][0]["id"]

    add_res = client.post(
        "/api/v1/cart/items",
        json={"inventory_id": inv_id, "quantity": 1},
        headers=headers_c1
    )
    assert add_res.status_code == 201
    c1_cart = add_res.json()
    assert len(c1_cart["items"]) >= 1

    # Customer 2 inspects their own cart - must be empty and completely isolated!
    c2_cart = client.get("/api/v1/cart", headers=headers_c2).json()
    assert len(c2_cart["items"]) == 0
    assert float(c2_cart["subtotal"]) == 0.0
