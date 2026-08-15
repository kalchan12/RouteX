# Algorithms: Dijkstra

## Overview

RouteX ships a from-scratch **Dijkstra** implementation as the reference routing
algorithm. It is exposed through the `RoutingAlgorithm` interface and registered
as `dijkstra` in `engine/routing/registry.py`.

## Interface

```python
class RoutingAlgorithm(Protocol):
    id: str
    def compute_route(self, graph, origin, destination, **kwargs) -> Route: ...
```

`Route` carries the ordered edge ids and the total cost. The algorithm receives
a *weighted* graph — edge weights are the current (congestion-aware) travel
times, so routing adapts to live conditions.

## Cost function

Edge weight = `current_travel_time` from the traffic model
(`base_travel_time × (1 + congestion)`), with:

- `inf` for closed/accident roads (excluded from relaxation),
- optionally a small safety/penalty term for high-congestion edges (configurable
  in the cost function),
- optional additional penalties per mode (e.g. emergency vehicles).

This makes the objective **minimize expected travel time** under current
conditions — the basis for future dynamic-routing comparisons.

## Implementation notes

- Classic priority-queue Dijkstra over `NetworkXGraphAdapter`/our graph wrapper.
- Returns the predecessor chain reconstructed into an ordered route.
- Deterministic: ties are broken consistently (stable node ordering) so results
  are reproducible.

## Complexity

- `O((V + E) log V)` with a binary heap, where `V` = nodes, `E` = edges.
- Graph sizes are small (tens of nodes), so this is effectively instant; the
  design scales to larger networks.

## Testing

See `tests/algorithms/test_dijkstra.py`:

- shortest path on a known grid,
- closed roads are avoided (cost `inf`),
- congestion raises cost and can change the chosen path,
- dynamic weight updates produce different routes,
- determinism (same input → same route).

## Next milestones

- **A\*** — implemented, see [A*](astar.md) (admissible Euclidean heuristic).
- **Dynamic routing** — periodic recomputation when travel times change, and
  `reroute_vehicles_avoiding(road)` for closures.
