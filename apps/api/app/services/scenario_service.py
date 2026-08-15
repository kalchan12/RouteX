"""Scenario seeding and lookup against the database."""

from __future__ import annotations

from engine.config import ScenarioConfig
from scenarios import load_all_scenarios, load_scenario
from sqlalchemy.orm import Session

from app.models.scenario import Scenario


def seed_scenarios(db: Session) -> int:
    """Insert version-controlled scenario files into the DB (idempotent)."""
    existing = {scenario.id for scenario in db.query(Scenario).all()}
    added = 0
    for scenario_id, scenario in load_all_scenarios().items():
        if scenario_id in existing:
            continue
        db.add(
            Scenario(
                id=scenario_id,
                name=scenario.name,
                description=scenario.description,
                config=scenario.to_dict(),
            )
        )
        added += 1
    if added:
        db.commit()
    return added


def get_scenario_config(scenario_id: str) -> ScenarioConfig:
    """Load a scenario file; raises FileNotFoundError when missing."""
    return load_scenario(scenario_id)
