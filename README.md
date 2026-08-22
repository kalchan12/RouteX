# RouteX — Intelligent Traffic & Route Optimization Simulator

> **University Computer Science capstone project.** RouteX is a controlled
> simulation environment for traffic-management and route-optimization research —
> **not** a real-world navigation app like Google Maps.

RouteX builds a virtual city as a weighted graph, simulates vehicles and traffic
conditions, applies graph-based routing algorithms, responds dynamically to
congestion and road events, and evaluates optimization strategies using
measurable metrics. Every simulation is **deterministic and reproducible**.

```
             ROUTEX
                │
       ┌────────┴────────┐
       │                 │
   React UI          Simulation Core
       │                 │
       ▼                 ▼
  Zustand            ┌───┴───┐
      │          Network  Vehicles
      │             │        │
      ▼             ▼        ▼
   IndexedDB    Traffic  Routing
      │             │        │
      └─────────────┼────────┘
                    ▼
              PixiJS Renderer
                    │
                    ▼
           Browser Visualization
```

---

## Features

- **Graph-based road network** — nodes (intersections, origins, destinations,
  hospitals) and directed road edges with distance, speed limit, capacity and
  dynamic state.
- **Discrete-time simulation engine** — deterministic ticks: traffic lights,
  vehicle movement, road occupancy, congestion, dynamic travel times, events,
  metrics.
- **Routing algorithms** — Dijkstra and A* implemented from scratch with a
  pluggable cost function and an admissible A* heuristic; interface ready for
  dynamic routing.
- **Traffic model** — transparent, documented congestion model
  (`congestion = vehicles / capacity`), easy to replace later.
- **Event system** — road closures, accidents, traffic spikes, emergency
  vehicles, light changes (deterministic under a fixed seed).
- **Scenario system** — version-controlled JSON scenarios (normal, rush hour,
  accident, emergency, road closure).
- **Analytics & metrics** — travel time, congestion, speed, throughput, waiting
  time, emergency response, algorithm runtime; in-memory time series for charts.
- **Benchmarking** — headless algorithm comparison with real, computed results.
- **Live visualization** — PixiJS canvas rendering roads, vehicles, congestion,
  and selected routes, running in a Web Worker for smooth 60fps UI.
- **Local-first persistence** — Dexie.js + IndexedDB for saving networks,
  scenarios, and benchmark results.

---

## Architecture

The simulation runs **entirely in the browser** — no backend required.

```
Browser
  │
  ├── React + Vite (UI)
  │
  ├── Zustand (application state)
  │
  ├── Simulation Core (TypeScript)
  │     ├── Network (graph, nodes, edges)
  │     ├── Vehicles (spawning, movement, routing)
  │     ├── Traffic (congestion, traffic lights)
  │     ├── Simulation (clock, events, engine)
  │     ├── Routing (Dijkstra, A*, dynamic)
  │     ├── Optimization (route optimizer, signal optimizer)
  │     └── Analytics (metrics, benchmarks)
  │
  ├── PixiJS (rendering in Web Worker)
  │
  └── Dexie.js → IndexedDB (persistence)
```

The engine (`src/core/`) is framework-free and runs simulations independently of
the UI — enabling automated testing, benchmarking and reproducible experiments.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, PixiJS |
| State | Zustand |
| Persistence | Dexie.js, IndexedDB |
| Routing | Custom Dijkstra & A* |
| Visualization | PixiJS (Web Worker) |
| Testing | Vitest (unit), Playwright (E2E) |
| Styling | Tailwind CSS |
| Validation | Zod |

---

## Repository Structure

```
routex/
├── src/
│   ├── core/
│   │   ├── network/      # Graph, nodes, edges, builder
│   │   ├── vehicles/     # Vehicle manager, movement
│   │   ├── traffic/      # Congestion model, traffic lights
│   │   ├── simulation/   # Clock, events, engine, state
│   │   ├── routing/      # Dijkstra, A*, algorithms
│   │   ├── optimization/ # Route & signal optimizers
│   │   └── analytics/    # Metrics tracker, time series
│   │
│   ├── rendering/
│   │   └── pixi/         # PixiJS renderers
│   │
│   ├── stores/           # Zustand stores
│   ├── db/               # Dexie/IndexedDB schema
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── scenarios/        # Built-in scenario definitions
│   ├── types/            # Shared TypeScript types
│   ├── workers/          # Web Workers
│   ├── app/              # App-level components
│   └── main.tsx          # Entry point
│
├── tests/
│   ├── algorithms/
│   ├── network/
│   ├── simulation/
│   ├── traffic/
│   ├── vehicles/
│   ├── optimization/
│   └── integration/
│
├── scenarios/            # JSON scenario files
├── docs/                 # Architecture, algorithms, simulation docs
├── public/               # Static assets
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── .env.example
├── .gitignore
├── README.md
└── CONTRIBUTING.md
```

---

## Requirements

- Node.js 20+
- pnpm (recommended) or npm

---

## Environment Setup

```bash
# 1. Install dependencies
pnpm install

# 2. (Optional) Create environment file
cp .env.example .env
```

---

## Running Locally

```bash
# Development server with hot reload
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

Open http://localhost:5173 — select a scenario and start the simulation.

---

## Running Tests

```bash
# Unit tests (Vitest)
pnpm test

# Unit tests in watch mode
pnpm test:watch

# E2E tests (Playwright)
pnpm test:e2e
```

---

## Development Workflow

- Branches: `main` (stable) and feature branches
- Pull requests only — never commit directly to `main`
- Meaningful commit messages: `feat: implement dijkstra routing`, `fix: correct congestion calculation`, `test: add astar pathfinding tests`
- Before committing inspect staged files with `git status`, `git diff --staged` — **never** `git add .` blindly

---

## Security Notes (Mandatory)

- `.env`, credentials, private keys and generated database files must **never**
  be committed. See `.gitignore` and `.env.example`.
- All configuration comes from environment variables — no hard-coded secrets.
- If a secret is accidentally committed: stop, rotate/revoke it, and remove it
  from history.

---

## Roadmap

| Phase | Milestone |
| --- | --- |
| 1–8 | Foundation: repo, engine, graph, vehicles, Dijkstra, visualization ✅ |
| 9 | A* pathfinding ✅ |
| 10–11 | Traffic/congestion model refinements, adaptive traffic lights |
| 12 | Dynamic routing |
| 13–14 | Event system expansion, analytics |
| 15–16 | Optimization strategies, benchmarking dashboards |
| 17 | Optional AI features |

See `docs/` for the simulation model, algorithms, and experiment methodology.

---

## License

MIT — see [LICENSE](LICENSE). This is a university capstone project.