# Benchmarking methodology

Benchmarks compare routing algorithms headlessly on the same scenario, seed and
config. Results are **computed from real simulation runs** — never fabricated.

## Procedure

For each (scenario, algorithm, run):

1. Build the network and load the scenario.
2. Run the simulation to completion with a fixed seed.
3. Record end-of-run metrics.

Each run of the same inputs produces identical metrics (determinism), so
multiple runs mainly measure runtime variance, not stochastic spread.

## Reported metrics

| Metric | Meaning |
| --- | --- |
| `avg_travel_time` | mean vehicle travel time (s) |
| `completed_vehicles` | vehicles that reached their destination |
| `max_congestion` | peak road congestion (0–1) |
| `avg_speed` | mean effective vehicle speed (m/s) |
| `route_computation_ms` | time spent computing routes |

## Running

Via API: `POST /benchmarks` with `scenario_id`, `algorithms[]`, `runs`.

Via CLI (headless, no server):

```bash
cd /home/kal/RouteX
uv run python scripts/benchmarking/run_benchmark.py --scenario normal --algorithm dijkstra --runs 3
```

## Interpreting results

- Lower `avg_travel_time` and higher `completed_vehicles` indicate better routing
  under the modelled conditions.
- `max_congestion` and `avg_speed` capture network-level effects.
- Because the model is deterministic, differences between algorithms are
  attributable to routing decisions, not noise — ideal for a capstone analysis.
