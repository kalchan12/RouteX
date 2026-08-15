"""Benchmark API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class BenchmarkCreate(BaseModel):
    scenario_id: str
    algorithms: list[str] | None = None
    runs: int = 1


class BenchmarkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scenario_id: str
    results: list[dict[str, Any]]
    created_at: datetime
