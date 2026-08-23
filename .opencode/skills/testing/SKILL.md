---
name: testing
description: RouteX-specific testing skill covering simulation, algorithms, UI, and end-to-end behavior.
---

# RouteX Testing Skill

## Purpose

This skill defines the testing strategy for RouteX.

Testing must protect both:

- Simulation correctness
- User-facing functionality

---

# 1. Read First

Read:

- AGENT.md
- PROJECT.md
- ARCHITECTURE.md
- PLAN.md

Inspect the existing test setup before adding new infrastructure.

---

# 2. Testing Stack

RouteX uses:

- Vitest
- React Testing Library
- Playwright

Do not introduce another testing framework without an architectural reason.

---

# 3. Unit Tests

Use unit tests for deterministic core logic.

Priority areas:

- Graph operations
- Dijkstra
- A*
- Dynamic routing
- Vehicle movement
- Traffic-light logic
- Congestion calculations
- Metrics
- Scenario validation

Core algorithms should be testable without React or PixiJS.

---

# 4. Simulation Tests

Test simulation behavior using controlled scenarios.

Examples:

- Vehicle moves toward destination.
- Vehicle stops at red light.
- Vehicle resumes after green light.
- Vehicle slows behind another vehicle.
- Closed road affects routing.
- Accident changes route availability.
- Vehicle reaches destination.
- Metrics update correctly.

---

# 5. Deterministic Tests

Use fixed inputs and deterministic seeds where practical.

Do not rely on random traffic behavior for core correctness tests.

---

# 6. Component Tests

Use React Testing Library for meaningful UI behavior.

Test:

- Buttons
- Controls
- Scenario selection
- Metric display
- Dialogs
- Forms
- Error states

Do not test implementation details unnecessarily.

---

# 7. PixiJS Testing

Do not attempt to test every visual pixel.

Prioritize:

- Renderer receives correct simulation state.
- Objects are created correctly.
- Vehicle direction updates correctly.
- Traffic-light visual state matches simulation state.
- Selection behavior works.

Use manual visual verification for complex rendering.

---

# 8. E2E Tests

Use Playwright for important user workflows.

Example:

Open RouteX
    ↓
Select scenario
    ↓
Start simulation
    ↓
Observe simulation
    ↓
Pause
    ↓
Inspect metrics
    ↓
Reset

Test critical workflows rather than every possible UI path.

---

# 9. Regression Testing

Before changing core simulation behavior:

1. Run existing tests.
2. Make changes.
3. Run tests again.
4. Investigate failures.

Never delete a failing test just to make the suite pass.

---

# 10. Performance Testing

Only introduce performance tests when necessary.

Important future targets:

- Simulation tick performance
- Large vehicle counts
- Rendering performance
- Routing performance

Measure before optimizing.

---

# 11. Build Verification

After meaningful changes:

```bash
npm run build
```

Run the project's actual configured test command rather than assuming a script name.

---

# 12. Test Failures

When tests fail:

1. Determine whether the failure is caused by the change.
2. Determine whether the test itself is stale.
3. Fix the implementation or test appropriately.
4. Never hide failures.

Document significant blockers in PLAN.md.

---

# 13. Completion Criteria

Testing work is complete when:

- Relevant tests exist
- Relevant tests pass
- Build passes
- No known regression was ignored
- PLAN.md records the result
