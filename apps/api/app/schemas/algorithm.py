"""Algorithm + analytics API schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class AlgorithmRead(BaseModel):
    id: str
    name: str
    description: str


class MetricsRead(BaseModel):
    summary: dict[str, Any]
    history: list[dict[str, Any]]
