# RouteX — Architecture

> This document defines the CURRENT technical architecture of RouteX.
>
> If the implementation changes, this document MUST be updated.

---

# 1. Architectural Philosophy

RouteX is a:

> Browser-first, local-first traffic simulation platform.

The application should perform simulation, routing, visualization, analytics, and persistence primarily on the client.

There is no required traditional backend.

---

# 2. Current Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| UI | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Simulation Rendering | Three.js |
| State Management | Zustand |
| Validation | Zod |
| Local Database | IndexedDB |
| Database Wrapper | Dexie.js |
| Charts | Recharts |
| Unit Testing | Vitest |
| Component Testing | React Testing Library |
| E2E Testing | Playwright |
| Package Manager | npm |

---

# 3. Runtime Architecture

```text
Browser
│
├── React UI
│
├── Zustand
│
├── Simulation Core
│   ├── Network
│   ├── Routing
│   ├── Simulation
│   ├── Traffic
│   ├── Vehicles
│   ├── Optimization
│   └── Analytics
│
├── Three.js Renderer
│
└── Dexie
    │
    └── IndexedDB
```

---

# 4. Architectural Boundaries

## UI

Responsible for:

- User interaction
- Controls
- Forms
- Navigation
- Dashboards
- Data visualization

UI must NOT contain core simulation algorithms.

---

## Simulation Core

Responsible for:

- Simulation state
- Simulation clock
- Vehicle movement
- Traffic behavior
- Events
- Routing
- Optimization
- Metrics

The simulation core should be independent of React.

Ideally, the simulation can be tested without rendering the UI.

---

## Rendering

Three.js is responsible for visualizing:

- Roads
- Vehicles (cars, trucks, buses)
- Traffic lights
- Buildings, trees, sidewalks
- Pedestrians

Rendering code must not implement business logic.

The rendering layer is organized as:

```text
src/rendering/
└── three/
    ├── Renderer3D.ts        # Main Three.js renderer
    └── index.ts             # Exports
```

The renderer is a focused class that consumes simulation state from `simulation3d/SimulationEngine` and produces 3D visual output, handling lighting, shadows, and camera controls.

---

## Persistence

Dexie.js provides the application database layer.

IndexedDB stores:

- Networks
- Scenarios
- Saved simulations
- Benchmark results
- Analytics data

Do not persist every simulation tick.

---

# 5. Target Source Structure

```text
src/
│
├── core/
│   ├── network/
│   ├── simulation/
│   ├── vehicles/
│   ├── traffic/
│   ├── routing/
│   ├── optimization/
│   └── analytics/
│
├── rendering/
│   └── pixi/
│
├── stores/
│
├── db/
│
├── components/
│   ├── layout/
│   ├── simulation/
│   ├── scenarios/
│   ├── analytics/
│   ├── algorithms/
│   └── ui/
│
├── hooks/
│
├── lib/
│
├── types/
│
└── main.tsx
```

---

# 6. Core Modules

## Network

```text
core/network/
├── graph.ts
├── node.ts
├── edge.ts
└── network-builder.ts
```

Responsible for graph representation and road networks.

---

## Routing

```text
core/routing/
├── interface.ts
├── dijkstra.ts
├── astar.ts
└── dynamic-routing.ts
```

All routing algorithms should follow a common abstraction where practical.

---

## Simulation

```text
core/simulation/
├── engine.ts
├── clock.ts
├── state.ts
└── events.ts
```

---

## Traffic

```text
core/traffic/
├── congestion.ts
├── traffic-model.ts
└── traffic-lights.ts
```

---

## Vehicles

```text
core/vehicles/
├── vehicle.ts
├── vehicle-manager.ts
└── movement.ts
```

---

## Incidents

```text
core/incidents/
├── incident.ts
├── incident-manager.ts
└── incident-types.ts
```

Responsible for managing road incidents (accidents, construction, closures, debris, weather) and their effects on traffic flow.

---

## Optimization

```text
core/optimization/
├── interface.ts
├── route-optimizer.ts
└── signal-optimizer.ts
```

Only create optimization modules when they contain meaningful functionality.

---

## Analytics

```text
core/analytics/
├── metrics.ts
└── benchmarks.ts
```

---

# 7. State Management

Zustand should manage application-level state.

Example:

```text
simulationStatus
simulationTime
simulationSpeed

selectedVehicle
selectedRoad
selectedScenario

simulationMetrics
uiPreferences
```

Do not move the entire simulation engine into Zustand.

Preferred relationship:

```text
Simulation Engine
        ↓
Simulation State
        ↓
Zustand
        ↓
React UI
```

---

# 8. Rendering

PixiJS should be used for high-frequency simulation visualization.

React should not render hundreds or thousands of individual vehicles as DOM elements.

Preferred:

```text
React
  ↓
Simulation Controls

PixiJS
  ↓
Vehicles
Roads
Traffic Lights
Routes
```

---

# 9. Web Worker

A Web Worker may be used for heavy simulation computation if necessary.

If used:

```text
src/workers/
└── simulation.worker.ts
```

The worker must communicate through well-defined messages.

Do not introduce a worker merely for architectural aesthetics.

---

# 10. Persistence

Use:

```text
Dexie
 ↓
IndexedDB
```

No PostgreSQL is required.

No REST API is required.

No server-side database is required.

---

# 11. Scenario Architecture

Scenario definitions should be stored in:

```text
scenarios/
```

Examples:

```text
normal.json
rush_hour.json
accident.json
road_closure.json
emergency.json
```

Validate scenario data using Zod when appropriate.

---

# 12. Testing Architecture

```text
tests/
├── algorithms/
├── network/
├── simulation/
├── traffic/
├── vehicles/
├── incidents/
├── optimization/
└── integration/
```

Testing layers:

```text
Unit
 ↓
Component
 ↓
Integration
 ↓
E2E
```

---

# 13. Architectural Rules

1. Core logic must not depend on React.
2. Rendering must not implement simulation logic.
3. Routing algorithms must be independently testable.
4. Persistence must not control simulation behavior.
5. UI must consume state rather than directly manipulate internal simulation structures.
6. Avoid duplicate implementations.
7. Avoid circular dependencies.
8. Keep modules focused.
9. Prefer explicit interfaces.
10. Avoid unnecessary abstractions.

---

# 14. Architecture Change Protocol

If a task requires changing:

- Framework
- Build system
- Database
- State management
- Rendering engine
- Runtime model
- Backend strategy
- Folder architecture
- Major dependency
- Simulation architecture

the AI MUST:

1. Stop implementation.
2. Identify the proposed change.
3. Explain why the change is necessary.
4. Determine affected modules.
5. Update `ARCHITECTURE.md`.
6. Update `PLAN.md`.
7. Check `AGENT.md`.
8. Check `DESIGN.md` for affected UI consequences.
9. Only then continue implementation.

Never silently change architecture.

---

# 15. Architecture Source of Truth

When documents disagree:

```text
AGENT.md
    ↓
ARCHITECTURE.md
    ↓
PROJECT.md
    ↓
DESIGN.md
    ↓
PLAN.md
    ↓
Existing implementation
```

However, `PLAN.md` reflects current execution state and must be updated after changes.

If the code and architecture disagree, investigate whether:

- The code is stale.
- The architecture document is stale.
- An undocumented architectural change occurred.

Do not simply assume one is correct.
