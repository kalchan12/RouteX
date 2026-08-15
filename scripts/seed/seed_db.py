"""Seed the version-controlled scenario files into the database.

Run from the repo root (uses the API project for dependencies):

    uv run --project apps/api python scripts/seed/seed_db.py

Scenarios are also seeded automatically whenever the API starts, so this is only
needed for explicit re-seeding or non-API environments.
"""

from __future__ import annotations

import os
import sys

_API_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "apps", "api")
)
sys.path.insert(0, _API_DIR)

import app.models  # noqa: E402,F401  (registers tables on Base)
from app.db.base import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.services.scenario_service import seed_scenarios  # noqa: E402


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        added = seed_scenarios(db)
    print(f"Seeded {added} scenarios (idempotent; existing rows untouched).")


if __name__ == "__main__":
    main()
