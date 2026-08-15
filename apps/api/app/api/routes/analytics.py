"""Analytics API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.simulation import Simulation
from app.schemas.algorithm import MetricsRead
from app.services.simulation_manager import manager

router = APIRouter(tags=["analytics"])


@router.get("/simulations/{sim_id}/metrics", response_model=MetricsRead)
def get_metrics(sim_id: str, db: Session = Depends(get_db)) -> MetricsRead:
    simulation = db.get(Simulation, sim_id)
    if simulation is None:
        raise HTTPException(status_code=404, detail="simulation not found")

    runtime = manager.get(sim_id)
    if runtime is not None:
        summary = runtime.engine.metrics.summary(runtime.engine.manager)
        history = list(runtime.engine.metrics.history)
    else:
        summary = simulation.metrics_summary or {}
        history = []

    return MetricsRead(summary=summary, history=history)
