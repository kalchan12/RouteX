# Simulation model

RouteX is a **discrete-time, graph-based traffic simulation**. Time advances in
fixed ticks (`tick_duration = 1.0 s`), and each tick updates the world state in
a deterministic order.

## Time and ticks

- `SimulationClock` advances by `tick_duration` seconds per tick.
- `SimulationConfig.max_ticks` — if `0`, the run continues until the scenario's
  own duration (in seconds) elapses.
- Determinism: with a fixed scenario + seed, tick sequences are identical.

## Tick order (`SimulationEngine.step`)

1. Advance the clock.
2. Process **events** due this tick (road closures, reopenings, traffic spikes,
   emergency vehicles, light changes).
3. Apply the configured traffic spike (if any) by injecting extra vehicles.
4. Move vehicles: advance positions along their planned routes using the
   current travel time / congestion.
5. Refresh network state: occupancy, congestion, dynamic travel times for each
   road.
6. Record metrics for this tick.
7. Mark the simulation complete when `max_ticks` (or scenario duration) is
   reached.

## Units

| Quantity | Unit |
| --- | --- |
| Distance | meters |
| Speed | m/s (km/h inputs converted by the network builder) |
| Position | meters along an edge |
| Time | seconds (tick-duration 1.0 s) |

## Vehicle movement

- A vehicle follows a planned route (ordered list of edges).
- Movement is congestion-aware: `advance_position` applies the road's effective
  speed (see [Traffic model](traffic/model.md)) and stops at intersections /
  behind the vehicle ahead (`STOP_DISTANCE_M = 25`).
- `VehicleManager` handles spawning (including scheduled extras and emergency
  vehicles), route planning, arrival, and dynamic re-routing.

## State snapshot

Each tick the engine produces a `SimulationSnapshot`:

- tick / simulation time
- vehicle list (id, type, position, progress, current speed, status)
- per-road dynamic state (occupancy, congestion, travel time, status)
- route paths for visualization
- derived metrics summary

The snapshot is what the API broadcasts over WebSocket and what the frontend
renders.

## Events

Events are deterministic and defined in scenario JSON:

- `road_closure` / `road_reopen`
- `traffic_spike` (inject extra vehicles over a window)
- `emergency_vehicle` (spawns an emergency vehicle that ignores congestion and
  red lights)
- `light_change` (adjusts signal timings)

## Reproducibility

Any experiment that records a snapshot series or benchmark result is
reproducible by re-running the same scenario, seed, and config.
