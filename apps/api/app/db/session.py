"""Database engine and session factory.

Local development defaults to SQLite (no Docker required); production /
Docker use PostgreSQL via ``DATABASE_URL``. The engine's active simulation
state is kept in memory — only aggregated data is persisted.
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def _connect_args(database_url: str) -> dict[str, object]:
    if database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def create_db_engine():
    url = get_settings().database_url
    return create_engine(url, connect_args=_connect_args(url))


engine = create_db_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
