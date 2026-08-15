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
   Simulation         Algorithms
       │                 │
       ↓                 ↓
  Traffic Model      Dijkstra / A*
       │                 │
       └────────┬────────┘
                ↓
        Dynamic Routing
                ↓
          Optimization
                ↓
             AI/ML (optional)
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
  and selected routes, fed over WebSockets.
- **Security hygiene** — `.env`, secrets and generated data are git-ignored from
  the first commit.

## Architecture

The simulation engine is **separated from the UI** — the backend owns the
simulation state and algorithms, and the frontend only visualizes it.

```
Next.js + TypeScript (visualization)
        │  REST + WebSocket
        ▼
    FastAPI Backend
        │
   ┌────┴────┬──────────┐
Simulation  Routing   Analytics
  Engine    Engine      Engine
   └────┬────┴────┬─────┘
        ▼         ▼
 Traffic Model  Pathfinding
        └────┬────┘
             ▼
    Optimization Engine
             ▼
         PostgreSQL        (in-memory during active runs)
```

The engine (`engine/`) is dependency-free and runs simulations independently of
the frontend — enabling automated testing, benchmarking and reproducible
experiments.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn-style UI, PixiJS |
| Backend | Python, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic |
| Engine | Python (networkx may be used for research; core algorithms are implemented from scratch) |
| Database | PostgreSQL (SQLite fallback for local dev without Docker) |
| Real-time | WebSockets |
| Infrastructure | Docker, Docker Compose |
| Package managers | pnpm (frontend), **uv** (Python — chosen for speed and modern UX; see `docs/architecture/package-managers.md`) |
| Testing | Pytest (backend/engine), Vitest (frontend unit), Playwright (E2E) |
| CI | GitHub Actions |

## Repository structure

```
routex/
├── apps/
│   ├── web/            # Next.js frontend + PixiJS visualization
│   └── api/            # FastAPI backend (REST + WebSocket + DB)
├── engine/             # Simulation engine (framework-free)
│   ├── simulation/     # clock, engine, state, events
│   ├── network/        # nodes, edges, graph, network builder
│   ├── vehicles/       # vehicle model, manager, movement
│   ├── traffic/        # congestion, traffic model, traffic lights
│   ├── routing/        # interface, Dijkstra, registry
│   ├── optimization/   # interfaces (future strategies)
│   ├── analytics/      # metrics, benchmarks, reports
│   └── ai/             # optional provider interface + mock
├── shared/             # shared schemas/constants (future)
├── scenarios/          # version-controlled scenario JSON files
├── tests/              # engine + algorithm tests
├── docs/               # architecture, algorithms, API, experiments
├── scripts/            # seed, development, benchmarking helpers
├── docker/             # Dockerfiles
├── .github/workflows/  # CI
├── .env.example
├── docker-compose.yml
├── README.md
└── ...
```

## Requirements

- Python 3.12+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [pnpm](https://pnpm.io/) (frontend package manager)
- Docker + Docker Compose (optional — for PostgreSQL)

## Environment setup

```bash
# 1. Install uv and pnpm (if not present)
curl -LsSf https://astral.sh/uv/install.sh | sh
npm install -g pnpm

# 2. Python environment (workspace: engine + api)
uv sync --all-extras

# 3. Frontend dependencies
cd apps/web
pnpm install
cd ../..

# 4. Environment file (NEVER commit the real .env)
cp .env.example .env
```

## Running locally

Without Docker (SQLite fallback):

```bash
# Terminal 1 — API
cd apps/api
uv run --project . uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Frontend
cd apps/web
pnpm dev
```

Open http://localhost:3000 — create a simulation from the **Simulations** page and
watch the live map.

With Docker (PostgreSQL):

```bash
cp .env.example .env          # set DATABASE_URL to the postgres URL in the file
docker compose up --build
```

## Running tests

```bash
# Engine + algorithm tests
uv run pytest tests

# API tests
cd apps/api && uv run --project . pytest

# Frontend unit tests
cd apps/web && pnpm test

# Frontend E2E (requires API + web running, or Playwright webServer)
cd apps/web && pnpm exec playwright install chromium && pnpm test:e2e
```

## Development workflow

- Branches: `main` (stable) and `develop` (integration); feature branches like
  `feature/simulation-engine`.
- Pull requests only — never commit directly to `main`.
- Meaningful commit messages, e.g. `feat: implement dijkstra routing`,
  `fix: correct congestion calculation`, `test: add astar pathfinding tests`.
- Before committing inspect staged files with `git status`, `git diff --staged` —
  **never** `git add .` blindly.

## Security notes (mandatory)

- `.env`, credentials, private keys and generated database files must **never**
  be committed. See `.gitignore` and `.env.example`.
- All configuration comes from environment variables — no hard-coded secrets.
- If a secret is accidentally committed: stop, rotate/revoke it, and remove it
  from history.
- The AI layer is **optional** and disabled by default; no API key is required
  for the initial project.

## Roadmap

| Phase | Milestone |
| --- | --- |
| 1–8 | Foundation: repo, engine, graph, vehicles, Dijkstra, WebSocket, visualization ✅ |
| 9 | A* pathfinding ✅ |
| 10–11 | Traffic/congestion model refinements, adaptive traffic lights |
| 12 | Dynamic routing |
| 13–14 | Event system expansion, analytics |
| 15–16 | Optimization strategies, benchmarking dashboards |
| 17 | Optional AI features |

See `docs/` for the simulation model, algorithms, API and benchmark methodology.

## License

MIT — see [LICENSE](LICENSE). This is a university capstone project.
