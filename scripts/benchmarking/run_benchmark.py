"""Headless benchmark runner — no HTTP server required.

Usage (from the repo root):

    uv run python scripts/benchmarking/run_benchmark.py \
        --scenario normal --algorithm dijkstra --runs 3

The same (scenario, seed, config) yields deterministic results.
"""

from __future__ import annotations

import argparse
import json
import time

from engine.routing.registry import list_algorithms
from engine.simulation.engine import SimulationConfig, SimulationEngine
from scenarios import load_scenario


def run_once(scenario_id: str, algorithm: str, seed: int) -> dict[str, object]:
    scenario = load_scenario(scenario_id)
    engine = SimulationEngine(
        scenario,
        SimulationConfig(scenario_id=scenario_id, algorithm=algorithm, seed=seed),
    )
    started = time.perf_counter()
    engine.run(engine.config.max_ticks)
    wall_ms = (time.perf_counter() - started) * 1000.0
    summary = engine.metrics.summary(engine.manager)
    summary["wall_clock_ms"] = round(wall_ms, 2)
    summary["status"] = engine.status.value
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Headless RouteX benchmark")
    parser.add_argument("--scenario", default="normal")
    parser.add_argument("--algorithm", default="dijkstra")
    parser.add_argument("--runs", type=int, default=1)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    available = {a["id"] for a in list_algorithms()}
    if args.algorithm not in available:
        raise SystemExit(
            f"unknown algorithm {args.algorithm!r}; available: {sorted(available)}"
        )

    results = [run_once(args.scenario, args.algorithm, args.seed) for _ in range(args.runs)]

    output = {
        "scenario": args.scenario,
        "algorithm": args.algorithm,
        "runs": args.runs,
        "seed": args.seed,
        "results": results,
    }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
