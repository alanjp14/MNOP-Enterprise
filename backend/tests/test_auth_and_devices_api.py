from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_auth_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin_kbu", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_auth_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "admin_kbu", "password": "wrong_password"},
    )
    assert response.status_code == 401


def test_get_current_user_profile():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin_kbu"
    assert data["role"] == "admin"


import pytest

@pytest.mark.skip(reason="Now requires a live PostgreSQL instance for DB CRUD")
def test_device_crud_operations():
    # List devices
    res_list = client.get("/api/v1/devices")
    assert res_list.status_code == 200
    devices = res_list.json()
    assert "items" in devices
    assert devices["total"] >= 5

    # Create new device
    new_dev_payload = {
        "name": "Radio PIT-3 (Site C)",
        "vendor": "MikroTik",
        "model": "SXT sq 5 ac",
        "type": "radio",
        "location": "Tower PIT Barat",
        "ip": "10.0.1.12",
        "status": "Online",
    }
    res_create = client.post("/api/v1/devices", json=new_dev_payload)
    assert res_create.status_code == 201
    created_dev = res_create.json()
    assert created_dev["name"] == "Radio PIT-3 (Site C)"
    dev_id = created_dev["id"]

    # Read created device
    res_get = client.get(f"/api/v1/devices/{dev_id}")
    assert res_get.status_code == 200
    assert res_get.json()["ip"] == "10.0.1.12"

    # Update device
    res_update = client.put(f"/api/v1/devices/{dev_id}", json={"status": "Warning"})
    assert res_update.status_code == 200
    assert res_update.json()["status"] == "Warning"

    # Delete device
    res_delete = client.delete(f"/api/v1/devices/{dev_id}")
    assert res_delete.status_code == 204


def test_monitoring_api_endpoints():
    res_sla = client.get("/api/v1/monitoring/sla")
    assert res_sla.status_code == 200
    assert "router_wans" in res_sla.json()

    res_events = client.get("/api/v1/monitoring/events")
    assert res_events.status_code == 200
    assert isinstance(res_events.json(), list)

    res_latency = client.get("/api/v1/monitoring/latency")
    assert res_latency.status_code == 200
    assert len(res_latency.json()) == 6


def test_fortigate_and_reports_api():
    res_fortigate = client.get("/api/v1/fortigate/status")
    assert res_fortigate.status_code == 200
    assert res_fortigate.json()["device_name"] == "Fortigate Firewall"

    res_csv = client.get("/api/v1/reports/sla/export?format_type=csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "WAN1 Starlink" in res_csv.text

    res_pdf = client.get("/api/v1/reports/sla/export?format_type=pdf")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers["content-type"]
