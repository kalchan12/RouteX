---
name: react-typescript
description: RouteX-specific React and TypeScript development skill.
---

# RouteX React + TypeScript Skill

## Purpose

This skill defines how React and TypeScript should be used in RouteX.

---

# 1. Read First

Read:

- AGENT.md
- PROJECT.md
- ARCHITECTURE.md
- DESIGN.md
- PLAN.md

Inspect existing code before creating new components.

---

# 2. React Responsibility

React handles application UI.

React should manage:

- Navigation
- Controls
- Forms
- Scenario selection
- Settings
- Metrics panels
- Dashboards
- Dialogs
- Tables
- Charts

React should NOT contain core traffic simulation algorithms.

---

# 3. TypeScript

Use strong typing.

Prefer:

- Explicit interfaces
- Discriminated unions
- Type-safe state
- Narrow types
- Readonly data where appropriate

Avoid:

```typescript
any
```

unless there is a documented reason.

---

# 4. Component Design

Prefer small components with clear responsibilities.

Avoid:

- Giant components
- Components containing simulation engines
- Components containing routing algorithms
- Deeply tangled state

A component should generally:

1. Receive state/data.
2. Display it.
3. Trigger actions.

---

# 5. State Management

Use Zustand for application-level state where appropriate.

Do not put the entire simulation engine inside Zustand.

Prefer:

Simulation Engine
    ↓
Simulation State
    ↓
Zustand
    ↓
React

---

# 6. High-Frequency State

Do not force high-frequency vehicle position updates through React if doing so causes unnecessary rendering.

PixiJS should handle high-frequency visual updates.

React should receive lower-frequency application state where appropriate.

---

# 7. UI Components

Prefer existing shadcn/ui components before creating new primitives.

Reuse:

- Button
- Card
- Dialog
- Tabs
- Select
- Tooltip
- Badge
- Table

Do not create duplicate UI primitives.

---

# 8. Hooks

Use hooks for React-specific behavior.

Do not hide complex simulation logic inside hooks.

Simulation logic belongs in the core.

---

# 9. Data Validation

Use Zod where runtime validation is required, especially for:

- Scenario data
- Imported network data
- User configuration
- Persisted data

Do not add validation everywhere without a reason.

---

# 10. Error Handling

User-facing errors should be understandable.

Do not expose raw stack traces to users.

Log technical information appropriately during development.

---

# 11. Performance

Avoid unnecessary:

- Re-renders
- State updates
- Derived calculations
- Object creation

Use memoization only where it solves a measured or clear problem.

Do not use `useMemo` and `useCallback` everywhere automatically.

---

# 12. File Organization

Follow ARCHITECTURE.md.

Typical UI structure:

src/components/

```text
simulation/
dashboard/
analytics/
scenarios/
ui/
```

Do not create random feature folders.

---

# 13. Styling

Follow DESIGN.md.

Use the existing Tailwind/shadcn system.

Do not introduce another styling framework.

---

# 14. Completion Criteria

A React/TypeScript task is complete when:

- TypeScript passes
- UI works
- Existing behavior remains functional
- Appropriate tests exist
- Design rules are followed
- No unnecessary abstractions were introduced
- PLAN.md is updated
