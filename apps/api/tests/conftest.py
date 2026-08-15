"""Shared pytest fixtures for the API test-suite."""

from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_routex.db")

import pytest
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.main import app
from app.services.scenario_service import seed_scenarios


@pytest.fixture(scope="session", autouse=True)
def _setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_scenarios(db)
    finally:
        db.close()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def create_simulation(client: TestClient, scenario_id: str = "normal", **kwargs):
    payload = {"scenario_id": scenario_id, "algorithm": "dijkstra", "seed": 42}
    payload.update(kwargs)
    return client.post("/simulations", json=payload)
