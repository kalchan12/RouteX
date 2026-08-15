"""Project endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_create_and_get_project(client: TestClient) -> None:
    response = client.post(
        "/projects", json={"name": "Capstone", "description": "RouteX project"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Capstone"
    assert body["id"]

    project_id = body["id"]
    get_response = client.get(f"/projects/{project_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == project_id


def test_list_projects_empty(client: TestClient) -> None:
    response = client.get("/projects")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_missing_project_returns_404(client: TestClient) -> None:
    response = client.get("/projects/does-not-exist")
    assert response.status_code == 404


def test_create_project_requires_name(client: TestClient) -> None:
    response = client.post("/projects", json={"name": ""})
    assert response.status_code == 422
