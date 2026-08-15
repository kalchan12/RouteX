# Algorithms: A*

## Overview

A* is RouteX's second routing algorithm, alongside Dijkstra. It performs
best-first search using an **admissible straight-line heuristic**, so it finds
the same optimal path as Dijkstra while typically expanding fewer nodes on
larger networks.

## Heuristic

For a node `n` and travel-time cost functions:

```
h(n) = euclidean_distance(n, destination) / max_speed(over network)
```

- **Admissible** — straight-line distance is a lower bound on any road distance,
  so `distance / max_speed` never overestimates the true remaining travel time.
- **Consistent (monotone)** — holds because every edge cost is at least
  `edge_length / max_speed` (congestion only increases travel time). Consistency
  is what lets A* stop as soon as the destination is popped from the open set,
  guaranteeing optimality.

> Caveat: the heuristic is calibrated for travel-time costs. A custom cost
> function that is not lower-bounded by `distance / max_speed` may make A*
> non-optimal (it still finds a valid path). Use the default cost for optimal
> results.

## Implementation notes

- Priority queue ordered by `f(n) = g(n) + h(n)`.
- Tie-breaking on `(f, g, node_id)` keeps expansion deterministic.
- Closed-set A* (safe here because the heuristic is consistent).
- Node coordinates come from the graph; the same `Route` contract as Dijkstra.

## Complexity

Worst case is the same as Dijkstra (`O((V + E) log V)`), but the heuristic
typically prunes the search substantially on larger networks, which matters as
the project grows beyond the small default grid.

## Testing

See `tests/algorithms/test_astar.py`:

- finds the shortest path,
- **matches Dijkstra's result** (optimality check),
- no route when disconnected / all roads closed,
- closed-road and dynamic-weight handling,
- deterministic tie-breaking,
- cost-function override.

## Usage

`astar` is registered in the routing registry, so it is available everywhere
Dijkstra is: `POST /simulations` with `"algorithm": "astar"`, benchmarks, and
the frontend algorithm list.
