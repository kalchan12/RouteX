"""Simulation API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class SimulationCreate(BaseModel):
    scenario_id: str
    algorithm: str = "dijkstra"
    seed: int = 42
    max_ticks: int = 0
    speed: int = 10
    project_id: str | None = None


class SimulationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str | None
    scenario_id: str
    algorithm: str
    status: str
    seed: int
    speed: int
    config: dict[str, Any]
    metrics_summary: dict[str, Any] | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class SimulationSnapshot(BaseModel):
    tick: int
    time: float
    status: str
    algorithm: str
    nodes: list[dict[str, Any]]
    roads: list[dict[str, Any]]
    vehicles: list[dict[str, Any]]
    lights: list[dict[str, Any]]
    metrics: dict[str, Any]
    summary: dict[str, Any]
    events: list[dict[str, Any]]
