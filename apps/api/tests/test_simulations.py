"""Simulation + scenario + algorithm + benchmark endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import create_simulation


def test_list_scenarios_seeded(client: TestClient) -> None:
    response = client.get("/scenarios")
    assert response.status_code == 200
    ids = {scenario["id"] for scenario in response.json()}
    assert {"normal", "rush_hour", "accident", "emergency", "road_closure"} <= ids


def test_get_scenario(client: TestClient) -> None:
    response = client.get("/scenarios/normal")
    assert response.status_code == 200
    assert response.json()["id"] == "normal"
    assert "network" in response.json()["config"]


def test_list_algorithms(client: TestClient) -> None:
    response = client.get("/algorithms")
    assert response.status_code == 200
    algorithms = response.json()
    assert any(algo["id"] == "dijkstra" for algo in algorithms)


def test_create_and_start_simulation(client: TestClient) -> None:
    created = create_simulation(client)
    assert created.status_code == 201
    sim = created.json()
    assert sim["status"] == "pending"

    started = client.post(f"/simulations/{sim['id']}/start")
    assert started.status_code == 200
    assert started.json()["status"] == "running"


def test_create_simulation_unknown_scenario_404(client: TestClient) -> None:
    response = client.post(
        "/simulations", json={"scenario_id": "missing", "algorithm": "dijkstra"}
    )
    assert response.status_code == 404


def test_create_simulation_unknown_algorithm_400(client: TestClient) -> None:
    response = client.post(
        "/simulations", json={"scenario_id": "normal", "algorithm": "nope"}
    )
    assert response.status_code == 400


def test_snapshot_shape(client: TestClient) -> None:
    sim = create_simulation(client).json()
    response = client.get(f"/simulations/{sim['id']}/snapshot")
    assert response.status_code == 200
    snapshot = response.json()
    assert snapshot["status"] == "pending"
    assert isinstance(snapshot["nodes"], list)
    assert isinstance(snapshot["roads"], list)
    assert isinstance(snapshot["vehicles"], list)
    assert isinstance(snapshot["metrics"], dict)


def test_metrics_endpoint(client: TestClient) -> None:
    sim = create_simulation(client).json()
    response = client.get(f"/simulations/{sim['id']}/metrics")
    assert response.status_code == 200
    body = response.json()
    assert "summary" in body
    assert "history" in body


def test_websocket_connects_and_sends_snapshot(client: TestClient) -> None:
    sim = create_simulation(client).json()
    with client.websocket_connect(f"/ws/simulations/{sim['id']}") as websocket:
        snapshot = websocket.receive_json()
        assert snapshot["tick"] == 0
        assert "vehicles" in snapshot


def test_benchmark_runs_headless(client: TestClient) -> None:
    response = client.post(
        "/benchmarks",
        json={"scenario_id": "normal", "algorithms": ["dijkstra"], "runs": 1},
    )
    assert response.status_code == 201
    benchmark = response.json()
    assert benchmark["scenario_id"] == "normal"
    assert benchmark["results"][0]["algorithm"] == "dijkstra"
    assert "metrics" in benchmark["results"][0]
