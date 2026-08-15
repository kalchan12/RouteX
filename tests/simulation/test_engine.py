"""Simulation engine integration tests: determinism, events, lifecycle."""

from __future__ import annotations

from engine.config import ScenarioConfig
from engine.network.edge import RoadStatus
from engine.simulation.engine import SimulationEngine, SimulationStatus
from engine.simulation.events import EventType


def make_scenario(**overrides):
    data = {
        "id": "test",
        "name": "Test scenario",
        "description": "",
        "network": {"cols": 5, "rows": 3, "block": 500, "seed": 1},
        "vehicle_count": 20,
        "spawn_rate": 2.0,
        "duration": 100,
        "seed": 1,
        "vehicle_types": {"normal": 0.9, "bus": 0.05, "truck": 0.05},
        "traffic_lights": {"green_duration": 15.0, "red_duration": 15.0},
        "events": [],
    }
    data.update(overrides)
    return ScenarioConfig.from_dict(data)


def test_engine_is_deterministic() -> None:
    scenario = make_scenario()
    first = SimulationEngine(scenario)
    second = SimulationEngine(scenario)
    first.run(80)
    second.run(80)
    assert first.clock.tick == second.clock.tick
    snapshot_a = first.snapshot()
    snapshot_b = second.snapshot()
    assert snapshot_a["vehicles"] == snapshot_b["vehicles"]
    # simulation metrics are deterministic; routing wall-clock time is not
    metrics_a = snapshot_a["metrics"]
    metrics_b = snapshot_b["metrics"]
    for key in (
        "total_vehicles",
        "completed_vehicles",
        "total_travel_time",
        "avg_travel_time",
        "total_waiting_time",
        "max_congestion",
        "throughput",
    ):
        assert metrics_a[key] == metrics_b[key]


def test_engine_completes_at_max_ticks() -> None:
    scenario = make_scenario()
    engine = SimulationEngine(scenario)
    engine.run(200)
    assert engine.status is SimulationStatus.COMPLETED
    assert engine.clock.tick == scenario.duration


def test_engine_step_noop_when_not_running() -> None:
    engine = SimulationEngine(make_scenario())
    engine.step()
    assert engine.clock.tick == 0
    engine.start()
    engine.step()
    assert engine.clock.tick == 1


def test_pause_resume() -> None:
    engine = SimulationEngine(make_scenario())
    engine.start()
    engine.step()
    engine.pause()
    assert engine.status is SimulationStatus.PAUSED
    engine.step()
    assert engine.clock.tick == 1
    engine.start()
    engine.step()
    assert engine.clock.tick == 2


def test_reset_is_deterministic_replay() -> None:
    scenario = make_scenario()
    engine = SimulationEngine(scenario)
    engine.run(60)
    snapshot_before = engine.snapshot()
    engine.reset()
    engine.run(60)
    assert engine.snapshot()["vehicles"] == snapshot_before["vehicles"]


def test_vehicles_spawn_and_move() -> None:
    engine = SimulationEngine(make_scenario(vehicle_count=30))
    engine.run(30)
    snapshot = engine.snapshot()
    assert snapshot["metrics"]["total_vehicles"] > 0
    moving = [v for v in snapshot["vehicles"] if v["status"] == "active"]
    assert any(v["speed"] >= 0 for v in moving)
    assert len(snapshot["roads"]) > 0


def test_road_closure_event_reroutes() -> None:
    scenario = make_scenario(
        vehicle_count=40,
        duration=120,
        seed=5,
        events=[{"type": "road_closure", "timestamp": 50, "road_id": "h_2_1"}],
    )
    engine = SimulationEngine(scenario)
    engine.run(70)
    assert engine.network.edges["h_2_1"].status is RoadStatus.CLOSED
    for vehicle in engine.manager.vehicles.values():
        if vehicle.status.value == "active":
            assert "h_2_1" not in vehicle.route_edges


def test_road_reopening_event() -> None:
    scenario = make_scenario(
        events=[
            {"type": "road_closure", "timestamp": 10, "road_id": "h_2_1"},
            {"type": "road_reopening", "timestamp": 40, "road_id": "h_2_1"},
        ]
    )
    engine = SimulationEngine(scenario)
    engine.run(50)
    assert engine.network.edges["h_2_1"].status is RoadStatus.OPEN


def test_traffic_spike_spawns_extra_vehicles() -> None:
    scenario = make_scenario(
        events=[
            {"type": "traffic_spike", "timestamp": 20, "duration": 5, "payload": {"count": 2}}
        ]
    )
    engine = SimulationEngine(scenario)
    engine.run(30)
    extra = [v for v in engine.manager.vehicles if v.startswith("extra_")]
    assert len(extra) >= 10


def test_emergency_vehicle_event() -> None:
    scenario = make_scenario(
        events=[{"type": "emergency_vehicle", "timestamp": 10, "payload": {"count": 1}}]
    )
    engine = SimulationEngine(scenario)
    engine.run(20)
    emergency = [
        v
        for v in engine.manager.vehicles.values()
        if v.vehicle_type.value == "emergency"
    ]
    assert len(emergency) >= 1


def test_snapshot_event_types() -> None:
    scenario = make_scenario(
        events=[{"type": "road_closure", "timestamp": 10, "road_id": "h_2_1"}]
    )
    engine = SimulationEngine(scenario)
    engine.run(10)
    snapshot = engine.snapshot()
    assert any(
        event["type"] == EventType.ROAD_CLOSURE.value for event in snapshot["events"]
    )
