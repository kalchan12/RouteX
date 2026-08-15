# Traffic model

This is a **simplified teaching model** — deliberately transparent and
configurable, so real-world data can replace it later without changing the
architecture.

## Core formulas

Per directed road edge:

```
congestion          = vehicle_count / capacity
current_travel_time = base_travel_time × (1 + congestion)
effective_speed     = speed_limit / (1 + congestion)
```

- `vehicle_count` — vehicles currently on the edge.
- `capacity` — edge capacity (from scenario/network config).
- `base_travel_time` = edge length / speed limit.
- Congestion is bounded to a maximum (default `1.0`) so travel time grows at
  most `2×` base; `congestion_factor` controls sensitivity.

## Special cases

- **Closed / accident roads**: cost is `inf` (un-routable until reopened).
- **Emergency vehicles**: ignore congestion and red lights (fastest path).
- **Traffic spikes**: a window of increased spawn rate raises vehicle count and
  therefore congestion.

## Traffic lights

- Fixed-cycle two-phase signals (vertical/horizontal), alternating on a schedule.
- `TrafficLightController` owns lights; `build_lights` creates them per scenario.
- Stopped vehicles wait at red lights; emergency vehicles pass through.

## Rationale

The congestion model is intentionally simple so that:

1. Results are easy to explain and verify.
2. Benchmarks stay deterministic.
3. Future milestones (adaptive signal timing, dynamic pricing, flow-based
   models) can build on a stable foundation.
