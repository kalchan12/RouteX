"""RouteX FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401  (registers ORM tables)
from app.api.routes import (
    algorithms,
    analytics,
    benchmarks,
    projects,
    scenarios,
    simulations,
)
from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.services.scenario_service import seed_scenarios

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    setup_logging(settings.log_level)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        added = seed_scenarios(db)
        if added:
            logger.info("seeded %d scenarios into database", added)
    finally:
        db.close()
    yield


app = FastAPI(title="RouteX API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(scenarios.router)
app.include_router(algorithms.router)
app.include_router(simulations.router)
app.include_router(analytics.router)
app.include_router(benchmarks.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
