from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["service"] == "MNOP API"


def test_liveness_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "up"
    assert payload["service"] == "MNOP API"
