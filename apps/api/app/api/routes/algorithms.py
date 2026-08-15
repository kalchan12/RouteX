"""Algorithms API."""

from __future__ import annotations

from engine.routing.registry import list_algorithms
from fastapi import APIRouter

from app.schemas.algorithm import AlgorithmRead

router = APIRouter(prefix="/algorithms", tags=["algorithms"])


@router.get("", response_model=list[AlgorithmRead])
def list_algorithms_route() -> list[AlgorithmRead]:
    return [
        AlgorithmRead(id=item["id"], name=item["name"], description=item["description"])
        for item in list_algorithms()
    ]
