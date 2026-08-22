# RouteX — Development Plan

> This is a LIVING document.
>
> AI agents MUST read this file before beginning meaningful work and MUST update it after completing meaningful work.
>
> `PLAN.md` describes the CURRENT development state, not just the original roadmap.

---

# 1. Current Status

**Project:** RouteX

**Current Phase:** Architecture Cleanup / Foundation

**Overall Status:** IN PROGRESS

**Last Updated:** YYYY-MM-DD

**Current Priority:** Establish a clean browser-first architecture before expanding simulation functionality.

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

**Status:** IN_PROGRESS

Goal:

Remove obsolete architecture and establish one coherent browser-first RouteX codebase.

Tasks:

- [ ] P0 — Audit existing repository
- [ ] P0 — Identify duplicate simulation implementations
- [ ] P0 — Identify obsolete backend architecture
- [ ] P0 — Identify obsolete Next.js architecture
- [ ] P0 — Establish canonical TypeScript simulation engine
- [ ] P0 — Consolidate source structure
- [ ] P0 — Remove obsolete backend code
- [ ] P0 — Remove obsolete Next.js code
- [ ] P0 — Remove generated artifacts
- [ ] P1 — Update package dependencies
- [ ] P1 — Update tests
- [ ] P1 — Update documentation
- [ ] P0 — Verify build
- [ ] P0 — Verify tests

Exit Criteria:

```text
[ ] One frontend
[ ] One simulation engine
[ ] No obsolete backend dependency
[ ] No duplicate core implementation
[ ] Build passes
[ ] Tests pass
[ ] Documentation reflects actual architecture
```

---

# 6. Phase 1 — Foundation

**Status:** NOT_STARTED

Tasks:

- [ ] P0 — Finalize Vite application structure
- [ ] P0 — Finalize TypeScript configuration
- [ ] P0 — Establish core module boundaries
- [ ] P1 — Establish Zustand stores
- [ ] P1 — Establish Dexie database
- [ ] P1 — Establish scenario validation
- [ ] P1 — Establish reusable UI components
- [ ] P1 — Establish PixiJS rendering boundary
- [ ] P1 — Establish test infrastructure

Exit Criteria:

```text
[ ] Application runs
[ ] Core modules are isolated
[ ] UI and simulation are separated
[ ] IndexedDB is functional
[ ] PixiJS renders successfully
[ ] Tests execute
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
<task>

Status:
<status>

Started:
<date>

Owner:
AI / Human / Team

Blocked By:
<none or task>

Expected Result:
<result>
```

---

# 18. Next Task

The AI MUST identify the next recommended task.

```text
Next Task:
<task>

Priority:
<P0/P1/P2/P3>

Reason:
<why this should happen next>
```

---

# 19. Recently Completed

Keep a short history of meaningful completed work.

Example:

```text
- [YYYY-MM-DD] Consolidated TypeScript simulation engine.
- [YYYY-MM-DD] Removed obsolete FastAPI architecture.
- [YYYY-MM-DD] Migrated simulation renderer to PixiJS.
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

Example:

```text
Date:
YYYY-MM-DD

Change:
Moved simulation execution into a Web Worker.

Reason:
Reduce UI thread contention during large simulations.

Affected Components:
Simulation
Rendering
State
Worker

Documentation Updated:
ARCHITECTURE.md

Tests Updated:
Simulation worker tests
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
