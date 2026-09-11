# RouteX — Development Plan

> This is a LIVING document.
>
> AI agents MUST read this file before beginning meaningful work and MUST update it after completing meaningful work.
>
> `PLAN.md` describes the CURRENT development state, not just the original roadmap.

---

# 1. Current Status

**Project:** RouteX

**Current Phase:** Phase 7 — Analytics / Phase 9 — Optimization

**Overall Status:** IN PROGRESS

**Last Updated:** 2026-09-11

**Current Priority:** Connect historical telemetry, advance analytics reporting, and implement multi-objective route optimization.

---

# 2. How AI Should Use This File

Before starting work:

1. Read `AGENT.md`.
2. Read `PROJECT.md`.
3. Read `ARCHITECTURE.md`.
4. Read `DESIGN.md`.
5. Read this file.
6. Identify the highest-priority incomplete task.
7. Check whether the task is blocked.
8. Inspect the actual code before implementation.

After completing work:

1. Mark the task appropriately.
2. Record important implementation decisions.
3. Record tests.
4. Record failures.
5. Add discovered follow-up tasks.
6. Update the current phase.
7. Update the next task.
8. Update the date.

---

# 3. Status Definitions

Use ONLY these statuses:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
COMPLETE
DEFERRED
CANCELLED
```

Do not use vague statuses such as:

```text
Almost done
Mostly done
Basically finished
Working on it
```

---

# 4. Priority Definitions

```text
P0 = Critical / blocks project
P1 = High priority
P2 = Normal priority
P3 = Optional / future
```

---

# 5. Current Phase

## Phase 0 — Architecture Cleanup

**Status:** COMPLETE

Goal:

Remove obsolete architecture and establish one coherent browser-first RouteX codebase.

Tasks:

- [x] P0 — Audit existing repository
- [x] P0 — Identify duplicate simulation implementations
- [x] P0 — Identify obsolete backend architecture
- [x] P0 — Identify obsolete Next.js architecture
- [x] P0 — Establish canonical TypeScript simulation engine
- [x] P0 — Consolidate source structure
- [x] P0 — Remove obsolete backend code
- [x] P0 — Remove obsolete Next.js code
- [x] P0 — Remove generated artifacts
- [x] P1 — Update package dependencies
- [x] P1 — Update tests
- [x] P1 — Update documentation
- [x] P0 — Verify build
- [x] P0 — Verify tests

Exit Criteria:

```text
[x] One frontend
[x] One simulation engine
[x] No obsolete backend dependency
[x] No duplicate core implementation
[x] Build passes
[x] Tests pass
[x] Documentation reflects actual architecture
```

---

# 6. Phase 1 — Foundation

**Status:** COMPLETE

Tasks:

- [x] P0 — Finalize Vite application structure
- [x] P0 — Finalize TypeScript configuration
- [x] P0 — Establish core module boundaries
- [x] P1 — Establish Zustand stores
- [x] P1 — Establish Dexie database
- [x] P1 — Establish scenario validation
- [x] P1 — Establish reusable UI components
- [x] P1 — Establish Three.js rendering boundary
- [x] P1 — Establish test infrastructure

Exit Criteria:

```text
[x] Application runs
[x] Core modules are isolated
[x] UI and simulation are separated
[x] IndexedDB is functional
[x] Three.js renders successfully
[x] Tests execute
```

---

# 7. Phase 2 — Network Model

**Status:** COMPLETE

Tasks:

- [x] P0 — Implement graph representation
- [x] P0 — Implement node model
- [x] P0 — Implement edge model
- [x] P1 — Implement network builder
- [x] P1 — Load network from scenario
- [x] P1 — Validate network
- [x] P1 — Add network tests

Exit Criteria:

```text
[x] Graph can be created
[x] Roads can be represented
[x] Nodes can be connected
[x] Network can be loaded
[x] Network tests pass
```

---

# 8. Phase 3 — Routing

**Status:** COMPLETE

Tasks:

- [x] P0 — Define routing interface
- [x] P0 — Implement Dijkstra
- [x] P0 — Implement A*
- [x] P1 — Implement dynamic routing (Dynamic HLD + evasive incident rerouting)
- [x] P1 — Support congestion-aware costs
- [x] P1 — Support closed roads
- [x] P1 — Add routing benchmarks
- [x] P0 — Add routing tests

Exit Criteria:

```text
[x] Algorithms return correct paths
[x] Closed roads are handled
[x] Dynamic weights work
[x] Algorithms can be benchmarked
```

---

# 9. Phase 4 — Simulation

**Status:** COMPLETE

Tasks:

- [x] P0 — Implement simulation clock
- [x] P0 — Implement simulation state
- [x] P0 — Implement simulation engine
- [x] P0 — Implement vehicle model
- [x] P0 — Implement vehicle movement (continuous 3D physics IDM/MOBIL)
- [x] P1 — Implement vehicle spawning
- [x] P1 — Implement deterministic random seed
- [x] P1 — Implement simulation events
- [x] P0 — Add simulation tests

Exit Criteria:

```text
[x] Vehicles can spawn
[x] Vehicles can move
[x] Simulation clock works
[x] Simulation can pause
[x] Simulation can resume
[x] Simulation can reset
[x] Reproducibility works where practical
```

---

# 10. Phase 5 — Traffic

**Status:** COMPLETE

Tasks:

- [x] P0 — Implement road capacity
- [x] P0 — Implement congestion model
- [x] P0 — Implement travel-time calculation
- [x] P1 — Implement traffic lights
- [x] P1 — Implement traffic-light state transitions
- [x] P1 — Implement adaptive traffic signals
- [x] P0 — Add traffic tests

---

# 11. Phase 6 — Scenarios

**Status:** COMPLETE

Tasks:

- [x] P0 — Normal traffic scenario
- [x] P0 — Rush-hour scenario
- [x] P1 — Accident scenario
- [x] P1 — Road closure scenario
- [x] P1 — Emergency vehicle scenario
- [x] P1 — Scenario loader
- [x] P1 — Scenario validation

---

# 12. Phase 7 — Analytics

**Status:** IN_PROGRESS

Tasks:

- [x] P0 — Vehicle metrics
- [x] P0 — Travel-time metrics
- [x] P0 — Congestion metrics
- [x] P1 — Throughput metrics
- [x] P1 — Waiting-time metrics
- [ ] P1 — Algorithm execution metrics
- [x] P1 — Analytics dashboard
- [ ] P1 — Historical results

---

# 13. Phase 8 — Benchmarking

**Status:** COMPLETE

Tasks:

- [x] P0 — Benchmark runner
- [x] P0 — Reproducible scenario execution
- [x] P0 — Algorithm comparison
- [x] P1 — Benchmark result persistence
- [x] P1 — Benchmark visualization
- [x] P1 — Export benchmark results

Important:

> Benchmark results must always come from actual executions.

Never create fake benchmark data.

---

# 14. Phase 9 — Optimization

**Status:** NOT_STARTED

Tasks:

- [ ] P1 — Define optimization objective
- [ ] P1 — Route optimization
- [ ] P1 — Adaptive traffic signal optimization
- [ ] P2 — Multi-objective optimization
- [ ] P2 — Optimization benchmarking

---

# 15. Phase 10 — AI

**Status:** DEFERRED

AI must only be considered after the core system is stable.

Possible tasks:

- [ ] P3 — Traffic prediction
- [ ] P3 — Congestion prediction
- [ ] P3 — Route recommendation
- [ ] P3 — Optimization recommendation

AI must remain optional.

---

# 16. Phase 11 — PWA / Offline

**Status:** DEFERRED

Possible tasks:

- [ ] P3 — Add PWA support
- [ ] P3 — Offline caching
- [ ] P3 — Installable application
- [ ] P3 — Offline validation

---

# 17. Current Task

The AI MUST keep this section updated.

```text
Current Task:
Implement network topology validation, dynamic incident evasion & in-flight rerouting, and expand unit test coverage.

Status:
COMPLETE

Started:
2026-09-11

Owner:
AI

Blocked By:
None

Expected Result:
- Graph topology validation logic and dedicated unit test suite.
- In-flight dynamic obstacle evasion and unblocked connection preference in 3D physics engine.
- Routing tests covering road closures and congestion penalties.
- All unit and E2E tests passing with clean production build.
```

---

# 18. Next Task

The AI MUST identify the next recommended task.

```text
Next Task:
Connect historical telemetry and analytics export to Dexie database

Priority:
P1

Reason:
Real-time simulation snapshots are recording into the Zustand telemetry series; wiring historical session exports and analytics comparisons directly from Dexie will finalize Phase 7.
```

---

# 19. Recently Completed

Keep a short history of meaningful completed work.

```text
- [2026-09-11] Implemented network topology validation and unit tests in src/core/network/ and tests/unit/network.test.ts (23 total unit tests passing).
- [2026-09-11] Added dynamic obstacle evasion in MOBIL and unblocked lane selection in 3D continuous simulation engine.
- [2026-09-11] Added routing tests for road closures and dynamic congestion-aware detour cost functions.
- [2026-09-04] Added ESLint configuration, expanded unit tests, and updated E2E smoke tests.
- [2026-09-04] Implemented Dynamic HLD routing algorithm and wired BenchmarkModal with Dexie IndexedDB persistence.
- [2026-09-04] Unified 3D simulation lifecycle and interactive Three.js rendering via singleton simulation service.
- [2026-09-04] Enhanced 3D physics engine with Emergency vehicles, dynamic incident controls, and 5 Adama regional scenarios.
- [2026-09-02] Migrated simulation visualization to full 3D using Three.js and removed 2D PixiJS pipeline entirely.
- [2026-09-02] Integrated continuous physics engine (IDM, MOBIL, Social Force) in src/core/simulation3d.
```

Do not delete historical entries unless this section becomes excessively large.

---

# 20. Decisions

Record important decisions discovered during implementation.

Example:

```text
Decision:
Use IndexedDB through Dexie instead of PostgreSQL.

Reason:
RouteX is browser-first and local-first.

Date:
YYYY-MM-DD
```

---

# 21. Blockers

Record anything preventing progress.

```text
Blocker:
<description>

Impact:
<what cannot proceed>

Possible Resolution:
<resolution>

Status:
BLOCKED
```

When a blocker is resolved, move it into the completed history.

---

# 22. Discovered Work

AI MUST add new work discovered during implementation rather than silently doing unrelated scope expansion.

Example:

```text
- [ ] P1 — Refactor routing interface discovered during simulation integration.
- [ ] P2 — Improve network validation.
```

Every discovered task should have:

- Priority
- Reason
- Scope
- Status

---

# 23. Architecture Change Log

Whenever architecture changes, record:

```text
Date:
Change:
Reason:
Affected Components:
Documentation Updated:
Tests Updated:
```

```text
Date:
2026-09-11

Change:
Implemented formal graph validation in the core network layer and dynamic obstacle evasion / unblocked lane preference in the 3D continuous physics engine.

Reason:
Ensure scenario topologies conform to valid mathematical graphs and allow simulated vehicles to realistically evade blocked lanes and incident points.

Affected Components:
- src/core/network/graph.ts
- src/core/simulation3d/SimulationEngine.ts
- tests/unit/network.test.ts
- tests/unit/routing.test.ts
- tests/unit/simulation.test.ts

Documentation Updated:
PLAN.md

Tests Updated:
Expanded Vitest unit tests from 14 to 23 passing tests.
```

```text
Date:
2026-09-02

Change:
Replaced PixiJS 2D rendering pipeline with Three.js 3D rendering pipeline. Integrated a continuous physics engine (IDM, MOBIL, Social Force) to drive the new 3D renderer.

Reason:
RouteX needed a more advanced, high-fidelity 3D visualization and realistic continuous physics (instead of discrete grid/tick based routing logic) for realistic simulation outputs.

Affected Components:
- Removed: src/rendering/pixi/, @pixi/react, pixi.js
- Added: src/rendering/three/, three, @types/three
- Added: src/core/simulation3d/ (continuous physics models)
- Updated: src/components/simulation/ViewportContainer.tsx, IncidentSimulationView.tsx, ControlPanel.tsx

Documentation Updated:
PLAN.md, ARCHITECTURE.md, README.md

Tests Updated:
Compilation checks verified.
```

```text
Date:
2026-08-23

Change:
Transitioned from graph-based visualization to realistic 2D traffic simulation architecture. Consolidated multiple architectures (FastAPI backend, Next.js frontend, Python engine, browser-engine) into single browser-first TypeScript codebase. Added PixiJS rendering layer with dedicated renderers.

Reason:
Original architecture had duplicate implementations (Python + TypeScript simulation engines, Next.js + Vite frontends). The new direction requires realistic 2D top-down traffic visualization with continuous vehicle movement, lanes, traffic lights, incidents, and pedestrians — which requires a clean rendering separation.

Affected Components:
- Removed: apps/api/, apps/web/, engine/, browser-engine/, docker/, shared/, scripts/
- Added: src/rendering/pixi/ (roadRenderer, nodeRenderer, vehicleRenderer, trafficLightRenderer, simulationRenderer)
- Extended: src/types/ (VehicleState, VehicleType, Incident, Pedestrian, EventType)
- Updated: src/core/vehicles/vehicleManager.ts (new Vehicle fields)
- Updated: src/scenarios/defaultScenarios.ts (incidents, pedestrians)
- Package manager: pnpm → npm

Documentation Updated:
ARCHITECTURE.md, PROJECT.md, PLAN.md, README.md

Tests Updated:
Unit tests pass (5 tests)
```

---

# 24. AI Evaluation Log

RouteX is also being developed as an experiment in AI-assisted software engineering.

For significant tasks, record:

```text
Task:
<task>

AI Approach:
<short description>

Files Changed:
<files>

Tests:
<results>

Architecture Compliance:
PASS / FAIL

Design Compliance:
PASS / FAIL

Human Intervention:
NONE / MINOR / MAJOR

Unexpected Changes:
<none or description>

Outcome:
SUCCESS / PARTIAL / FAILED
```

This allows the development process itself to be evaluated.

---

# 25. Definition of Done

A task is COMPLETE only when:

```text
[ ] Requested functionality implemented
[ ] Existing functionality preserved
[ ] Appropriate tests added/updated
[ ] Relevant tests pass
[ ] Build passes
[ ] Architecture remains valid
[ ] DESIGN.md updated if necessary
[ ] PROJECT.md updated if scope changed
[ ] PLAN.md updated
[ ] No secrets introduced
[ ] No unnecessary dependencies introduced
[ ] No unrelated scope expansion
```

---

# 26. Golden Development Loop

Every meaningful task follows:

```text
READ
 ↓
UNDERSTAND
 ↓
CHECK ARCHITECTURE
 ↓
CHECK DESIGN
 ↓
UPDATE PLAN
 ↓
IMPLEMENT
 ↓
TEST
 ↓
REVIEW DIFF
 ↓
UPDATE DOCUMENTATION
 ↓
UPDATE PLAN
 ↓
SELECT NEXT TASK
```

---

# 27. Final Principle

The plan is not a checklist that gets written once.

It is the project's **current state machine**.

The AI must always be able to answer:

> What has been completed?

> What is currently being worked on?

> What is blocked?

> What changed?

> What should happen next?

> Does the current implementation still match the documented architecture?

If the AI cannot answer these questions from `PLAN.md`, then `PLAN.md` is not being maintained correctly.
