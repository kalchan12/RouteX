# Architecture

RouteX is a monorepo with three runnable layers and a shared contract.

```
┌──────────────────────────────────────────────────────────────┐
│ apps/web  — Next.js + PixiJS visualization                    │
│   • renders network, vehicles, congestion, routes            │
│   • NO routing/simulation logic lives here                   │
└────────────────────────────┬─────────────────────────────────┘
                             │ REST + WebSocket
┌────────────────────────────▼─────────────────────────────────┐
│ apps/api  — FastAPI backend                                  │
│   • owns simulation runtime (SimulationManager)              │
│   • persists projects/scenarios/results (SQLAlchemy+Alembic) │
│   • REST endpoints + /ws/simulations/{id} WebSocket          │
└────────────────────────────┬─────────────────────────────────┘
                             │ imports
┌────────────────────────────▼─────────────────────────────────┐
│ engine/   — framework-free simulation engine                 │
│   • simulation / network / vehicles / traffic / routing      │
│   • analytics (metrics, benchmarks)                          │
│   • optimization + ai interfaces (stubs)                     │
└──────────────────────────────────────────────────────────────┘
```

## Design rules

1. **Engine is UI-independent and headless-runnable.** You can run a full
   simulation from a Python script with no HTTP server. The frontend never
   computes routes or simulation state.
2. **Determinism.** The same `(scenario, seed, config)` produces identical
   results. Randomness is only from seeded RNG. Metrics and benchmarks rely on
   this.
3. **Pluggable algorithms.** `engine/routing/registry.py` exposes algorithms by
   id; the API lists them via `GET /algorithms`. New algorithms implement
   `RoutingAlgorithm` and register themselves.
4. **Secrets never in code.** All configuration is via environment variables.

## Engine internal layout

```
engine/
├── config.py          # NetworkConfig, TrafficLightConfig, ScenarioConfig
├── simulation/        # clock, events, state, engine
├── network/           # node, edge, graph, builder (grid city)
├── vehicles/          # vehicle model, manager, movement physics
├── traffic/           # congestion, traffic model, traffic lights
├── routing/           # interface, dijkstra, registry (+ stubs)
├── optimization/      # interfaces + stubs (future milestone)
├── analytics/         # metrics tracker, benchmarks, reports
└── ai/                # provider interface + MockAIProvider (optional)
```

## Backend request flow

1. `POST /simulations` creates a runtime and a DB row.
2. `POST /simulations/{id}/start` launches an asyncio task running the engine.
3. Every ~0.1 s the runtime pushes a snapshot to connected WebSocket clients.
4. `POST /simulations/{id}/stop|pause|resume` control the loop.
5. `GET /simulations/{id}/metrics` returns the accumulated metric history.
6. `POST /benchmarks` runs a scenario headless (synchronously) across algorithms.

## Frontend layout

```
apps/web/
├── app/               # Next.js App Router pages
│   ├── dashboard/ simulations/ scenarios/ networks/
│   ├── algorithms/ benchmarks/ analytics/ settings/
│   └── simulations/[id]/   # live canvas page
├── components/
│   ├── simulation/    # SimulationCanvas (PixiJS), controls, stats
│   ├── charts/        # LineChart
│   ├── ui/            # Button, Card, Badge
│   └── layout/        # Sidebar
├── features/simulations/useSimulation.ts  # WS + lifecycle hook
├── lib/api.ts         # typed API + WS helpers
└── types/             # shared TS types mirroring API schemas
```

See [Simulation model](simulation/model.md) and [API reference](api/endpoints.md)
for details.
