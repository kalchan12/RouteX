"""Benchmarking API — headless algorithm comparison."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.metric import Benchmark
from app.schemas.benchmark import BenchmarkCreate, BenchmarkRead
from app.services.scenario_service import get_scenario_config
from app.services.simulation_manager import manager

router = APIRouter(prefix="/benchmarks", tags=["benchmarks"])


@router.post("", response_model=BenchmarkRead, status_code=201)
def create_benchmark(
    payload: BenchmarkCreate, db: Session = Depends(get_db)
) -> Benchmark:
    try:
        scenario = get_scenario_config(payload.scenario_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="scenario not found") from None

    try:
        results = manager.run_benchmark(scenario, payload.algorithms, payload.runs)
    except ValueError:
        raise HTTPException(status_code=400, detail="unknown algorithm") from None

    benchmark = Benchmark(
        id=str(uuid.uuid4()), scenario_id=payload.scenario_id, results=results
    )
    db.add(benchmark)
    db.commit()
    db.refresh(benchmark)
    return benchmark


@router.get("", response_model=list[BenchmarkRead])
def list_benchmarks(db: Session = Depends(get_db)) -> list[Benchmark]:
    return db.query(Benchmark).order_by(Benchmark.created_at.desc()).all()


@router.get("/{benchmark_id}", response_model=BenchmarkRead)
def get_benchmark(benchmark_id: str, db: Session = Depends(get_db)) -> Benchmark:
    benchmark = db.get(Benchmark, benchmark_id)
    if benchmark is None:
        raise HTTPException(status_code=404, detail="benchmark not found")
    return benchmark
