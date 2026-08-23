# RouteX — Development Plan

> This is a LIVING document.
>
> AI agents MUST read this file before beginning meaningful work and MUST update it after completing meaningful work.
>
> `PLAN.md` describes the CURRENT development state, not just the original roadmap.

---

# 1. Current Status

**Project:** RouteX

**Current Phase:** Phase 1 — Foundation / Rendering Integration

**Overall Status:** IN PROGRESS

**Last Updated:** 2026-08-23

**Current Priority:** PixiJS rendering layer integration and realistic 2D traffic simulation foundation.

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

**Status:** IN_PROGRESS

Tasks:

- [x] P0 — Finalize Vite application structure
- [x] P0 — Finalize TypeScript configuration
- [x] P0 — Establish core module boundaries
- [ ] P1 — Establish Zustand stores
- [ ] P1 — Establish Dexie database
- [ ] P1 — Establish scenario validation
- [ ] P1 — Establish reusable UI components
- [x] P1 — Establish PixiJS rendering boundary
- [x] P1 — Establish test infrastructure

Exit Criteria:

```text
[x] Application runs
[x] Core modules are isolated
[x] UI and simulation are separated
[ ] IndexedDB is functional
[x] PixiJS renders successfully
[x] Tests execute
```

---

# 7. Phase 2 — Network Model

**Status:** NOT_STARTED

Tasks:

- [ ] P0 — Implement graph representation
- [ ] P0 — Implement node model
- [ ] P0 — Implement edge model
- [ ] P1 — Implement network builder
- [ ] P1 — Load network from scenario
- [ ] P1 — Validate network
- [ ] P1 — Add network tests

Exit Criteria:

```text
[ ] Graph can be created
[ ] Roads can be represented
[ ] Nodes can be connected
[ ] Network can be loaded
[ ] Network tests pass
```

---

# 8. Phase 3 — Routing

**Status:** NOT_STARTED

Tasks:

- [ ] P0 — Define routing interface
- [ ] P0 — Implement Dijkstra
- [ ] P0 — Implement A*
- [ ] P1 — Implement dynamic routing
- [ ] P1 — Support congestion-aware costs
- [ ] P1 — Support closed roads
- [ ] P1 — Add routing benchmarks
- [ ] P0 — Add routing tests

Exit Criteria:

```text
[ ] Algorithms return correct paths
[ ] Closed roads are handled
[ ] Dynamic weights work
[ ] Algorithms can be benchmarked
```

---

# 9. Phase 4 — Simulation

**Status:** NOT_STARTED

Tasks:

- [ ] P0 — Implement simulation clock
- [ ] P0 — Implement simulation state
- [ ] P0 — Implement simulation engine
- [ ] P0 — Implement vehicle model
- [ ] P0 — Implement vehicle movement
- [ ] P1 — Implement vehicle spawning
- [ ] P1 — Implement deterministic random seed
- [ ] P1 — Implement simulation events
- [ ] P0 — Add simulation tests

Exit Criteria:

```text
[ ] Vehicles can spawn
[ ] Vehicles can move
[ ] Simulation clock works
[ ] Simulation can pause
[ ] Simulation can resume
[ ] Simulation can reset
[ ] Reproducibility works where practical
```

---

# 10. Phase 5 — Traffic

**Status:** NOT_STARTED

Tasks:

- [ ] P0 — Implement road capacity
- [ ] P0 — Implement congestion model
- [ ] P0 — Implement travel-time calculation
- [ ] P1 — Implement traffic lights
- [ ] P1 — Implement traffic-light state transitions
- [ ] P1 — Implement adaptive traffic signals
- [ ] P0 — Add traffic tests

---

# 11. Phase 6 — Scenarios

**Status:** NOT_STARTED

Tasks:

- [ ] P0 — Normal traffic scenario
- [ ] P0 — Rush-hour scenario
- [ ] P1 — Accident scenario
- [ ] P1 — Road closure scenario
- [ ] P1 — Emergency vehicle scenario
- [ ] P1 — Scenario loader
- [ ] P1 — Scenario validation

---

# 12. Phase 7 — Analytics

**Status:** NOT_STARTED

Tasks:

- [ ] P0 — Vehicle metrics
- [ ] P0 — Travel-time metrics
- [ ] P0 — Congestion metrics
- [ ] P1 — Throughput metrics
- [ ] P1 — Waiting-time metrics
- [ ] P1 — Algorithm execution metrics
- [ ] P1 — Analytics dashboard
- [ ] P1 — Historical results

---

# 13. Phase 8 — Benchmarking

**Status:** NOT_STARTED

Tasks:

- [ ] P0 — Benchmark runner
- [ ] P0 — Reproducible scenario execution
- [ ] P0 — Algorithm comparison
- [ ] P1 — Benchmark result persistence
- [ ] P1 — Benchmark visualization
- [ ] P1 — Export benchmark results

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
Transition from graph visualization to realistic 2D traffic simulation architecture

Status:
IN_PROGRESS

Started:
2026-08-23

Owner:
AI

Blocked By:
None

Expected Result:
- Clean architecture with src/core, src/rendering/pixi, src/components separation
- PixiJS rendering layer with road, node, vehicle, traffic light renderers
- Extended types for VehicleState, Incident, Pedestrian
- Build passes, tests pass
- Documentation updated
```

---

# 18. Next Task

The AI MUST identify the next recommended task.

```text
Next Task:
Implement vehicle movement with lane following and traffic light compliance

Priority:
P0

Reason:
The rendering foundation is in place. Next step is to enhance the simulation engine with realistic vehicle behaviors (lane following, acceleration/braking, traffic light stopping, collision avoidance) and connect them to the PixiJS renderer for visual validation.
```

---

# 19. Recently Completed

Keep a short history of meaningful completed work.

```text
- [2026-08-23] Consolidated TypeScript simulation engine into src/core/
- [2026-08-23] Removed obsolete FastAPI backend (apps/api/), Python engine (engine/), Next.js frontend (apps/web/), Docker infrastructure
- [2026-08-23] Established single npm-based package.json with React, Vite, PixiJS
- [2026-08-23] Created PixiJS rendering layer (src/rendering/pixi/) with road, node, vehicle, traffic light renderers
- [2026-08-23] Extended types: VehicleState, VehicleType (BUS, TRUCK), Incident, Pedestrian, new EventTypes
- [2026-08-23] Updated ARCHITECTURE.md, PROJECT.md, PLAN.md to reflect new architecture
- [2026-08-23] Build passes, tests pass (5 unit tests)
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
