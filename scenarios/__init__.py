"""Scenario loading and registry.

Scenario files are version-controlled JSON documents that define the network,
vehicle mix, events, duration and random seed. They must never contain
secrets.
"""

from __future__ import annotations

import json
from pathlib import Path

from engine.config import ScenarioConfig

_SCENARIOS_DIR = Path(__file__).parent
SCENARIO_EXT = ".json"


def list_scenario_ids() -> list[str]:
    return sorted(path.stem for path in _SCENARIOS_DIR.glob(f"*{SCENARIO_EXT}"))


def load_scenario(scenario_id: str) -> ScenarioConfig:
    path = _SCENARIOS_DIR / f"{scenario_id}{SCENARIO_EXT}"
    if not path.exists():
        raise FileNotFoundError(f"scenario not found: {scenario_id!r}")
    data = json.loads(path.read_text(encoding="utf-8"))
    return ScenarioConfig.from_dict(data)


def load_all_scenarios() -> dict[str, ScenarioConfig]:
    return {scenario_id: load_scenario(scenario_id) for scenario_id in list_scenario_ids()}
