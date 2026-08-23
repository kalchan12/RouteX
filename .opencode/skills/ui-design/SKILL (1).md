---
name: ui-design
description: RouteX-specific UI/UX skill for the traffic simulation dashboard and visual system.
---

# RouteX UI Design Skill

## Purpose

This skill defines how RouteX's interface should look and behave.

---

# 1. Read First

Always read:

- DESIGN.md
- PROJECT.md
- ARCHITECTURE.md

The actual project design rules in DESIGN.md take priority over this skill if they contain newer decisions.

---

# 2. Design Direction

RouteX should feel like:

Professional Engineering Tool
+
Traffic Simulation Platform
+
Data Visualization Dashboard
+
Subtle Cyberpunk

It should NOT feel like:

- Arcade game
- Gaming HUD
- Cryptocurrency dashboard
- Overloaded sci-fi interface

---

# 3. Primary Interface

The simulation screen should prioritize:

1. Simulation canvas
2. Simulation controls
3. Important metrics
4. Scenario information
5. Selected-object information

Do not cover the simulation with unnecessary panels.

---

# 4. Simulation Canvas

The simulation should visually communicate:

- Roads
- Lanes
- Intersections
- Cars
- Pedestrians
- Traffic lights
- Routes
- Incidents
- Congestion

The canvas is the primary visual focus.

---

# 5. Controls

Important controls may include:

- Start
- Pause
- Stop
- Reset
- Simulation speed
- Scenario
- Routing algorithm
- Camera controls

Controls must clearly communicate their state.

---

# 6. Metrics

Important metrics:

- Vehicles
- Completed vehicles
- Average speed
- Average travel time
- Congestion
- Waiting time
- Throughput

Use:

Metric cards
for current values.

Charts
for trends and comparisons.

Tables
for algorithm comparisons.

---

# 7. Colors

Use semantic colors.

Traffic state should not rely only on color.

Example:

Normal
Warning
Critical
Closed
Emergency

Pair color with:

- Icon
- Label
- Pattern
- Text

where appropriate.

---

# 8. Typography

Prioritize readability.

Use a clear hierarchy:

Page title
    ↓
Section title
    ↓
Component title
    ↓
Body
    ↓
Metadata

Avoid oversized marketing-style typography.

---

# 9. Interaction

Interactions should feel predictable.

Buttons should clearly communicate:

- What they do
- Current state
- Whether an action is destructive

Use confirmation for destructive actions where appropriate.

---

# 10. Animation

Animation should communicate system behavior.

Good uses:

- Vehicle movement
- Traffic-light transitions
- Loading
- State changes
- Panel transitions

Avoid:

- Constant flashing
- Excessive glow
- Excessive particles
- Decorative animation everywhere

---

# 11. Accessibility

Prioritize:

- Keyboard navigation
- Focus states
- Semantic HTML
- Accessible labels
- Sufficient contrast
- Non-color-only status indicators
- Reduced-motion support where practical

---

# 12. Responsive Behavior

Desktop is the primary target.

The simulation experience should remain usable at smaller widths.

Do not sacrifice the desktop simulation experience for mobile-first design.

---

# 13. Component Reuse

Before creating a new component:

1. Check existing components.
2. Check shadcn/ui.
3. Reuse existing design patterns.

Avoid duplicate components.

---

# 14. Completion Criteria

A UI task is complete when:

- DESIGN.md is followed
- Existing visual language is preserved
- Interaction is clear
- Accessibility is considered
- Responsive behavior is reasonable
- No unnecessary visual complexity was introduced
- Relevant tests pass
- PLAN.md is updated
