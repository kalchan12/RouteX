"""Simulations API (REST + WebSocket)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from engine.routing.registry import get_algorithm
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.simulation import Simulation
from app.schemas.simulation import SimulationCreate, SimulationRead, SimulationSnapshot
from app.services.scenario_service import get_scenario_config
from app.services.simulation_manager import manager

router = APIRouter(tags=["simulations"])


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _sim_or_404(db: Session, sim_id: str) -> Simulation:
    simulation = db.get(Simulation, sim_id)
    if simulation is None:
        raise HTTPException(status_code=404, detail="simulation not found")
    return simulation


@router.get("/simulations", response_model=list[SimulationRead])
def list_simulations(db: Session = Depends(get_db)) -> list[Simulation]:
    return db.query(Simulation).order_by(Simulation.created_at.desc()).all()


@router.post("/simulations", response_model=SimulationRead, status_code=201)
def create_simulation(payload: SimulationCreate, db: Session = Depends(get_db)) -> Simulation:
    try:
        scenario = get_scenario_config(payload.scenario_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="scenario not found") from None
    try:
        get_algorithm(payload.algorithm)
    except ValueError:
        raise HTTPException(status_code=400, detail="unknown algorithm") from None

    sim_id = str(uuid.uuid4())
    simulation = Simulation(
        id=sim_id,
        project_id=payload.project_id,
        scenario_id=payload.scenario_id,
        algorithm=payload.algorithm,
        status="pending",
        seed=payload.seed,
        speed=payload.speed,
        config={
            "max_ticks": payload.max_ticks,
            "project_id": payload.project_id,
            "scenario_config": scenario.to_dict(),
        },
    )
    db.add(simulation)
    db.commit()
    db.refresh(simulation)

    manager.create(
        sim_id,
        scenario,
        payload.algorithm,
        payload.seed,
        payload.max_ticks,
        payload.speed,
    )
    return simulation


@router.get("/simulations/{sim_id}", response_model=SimulationRead)
def get_simulation(sim_id: str, db: Session = Depends(get_db)) -> Simulation:
    return _sim_or_404(db, sim_id)


@router.get("/simulations/{sim_id}/snapshot", response_model=SimulationSnapshot)
def get_snapshot(sim_id: str, db: Session = Depends(get_db)) -> dict:
    _sim_or_404(db, sim_id)
    snapshot = manager.snapshot(sim_id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="simulation runtime not found")
    return snapshot


@router.post("/simulations/{sim_id}/start", response_model=SimulationRead)
async def start_simulation(sim_id: str, db: Session = Depends(get_db)) -> Simulation:
    simulation = _sim_or_404(db, sim_id)
    manager.start(sim_id)
    simulation.status = "running"
    simulation.started_at = _utcnow()
    db.commit()
    db.refresh(simulation)
    return simulation


@router.post("/simulations/{sim_id}/pause", response_model=SimulationRead)
async def pause_simulation(sim_id: str, db: Session = Depends(get_db)) -> Simulation:
    simulation = _sim_or_404(db, sim_id)
    manager.pause(sim_id)
    simulation.status = "paused"
    db.commit()
    db.refresh(simulation)
    return simulation


@router.post("/simulations/{sim_id}/stop", response_model=SimulationRead)
async def stop_simulation(sim_id: str, db: Session = Depends(get_db)) -> Simulation:
    simulation = _sim_or_404(db, sim_id)
    manager.stop(sim_id)
    simulation.status = "stopped"
    simulation.finished_at = _utcnow()
    runtime = manager.get(sim_id)
    if runtime is not None:
        simulation.metrics_summary = runtime.engine.metrics.summary(runtime.engine.manager)
    db.commit()
    db.refresh(simulation)
    return simulation


@router.websocket("/ws/simulations/{sim_id}")
async def simulation_websocket(websocket: WebSocket, sim_id: str) -> None:
    if not await manager.connect(sim_id, websocket):
        await websocket.close(code=4004)
        return
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(sim_id, websocket)
