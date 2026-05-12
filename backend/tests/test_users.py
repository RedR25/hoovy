import pytest


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_register_then_login(client):
    payload = {"email": "a@b.co", "password": "supersecret", "full_name": "A"}
    r = await client.post("/api/v1/users", json=payload)
    assert r.status_code == 201, r.text
    user = r.json()
    assert user["email"] == "a@b.co"

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "a@b.co", "password": "supersecret"},
    )
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_duplicate_email_conflicts(client):
    payload = {"email": "dup@b.co", "password": "supersecret"}
    assert (await client.post("/api/v1/users", json=payload)).status_code == 201
    r = await client.post("/api/v1/users", json=payload)
    assert r.status_code == 409
