# RouteX — Design System & UI Rules

> This document defines how RouteX should look, feel, and behave.

---

# 1. Design Direction

RouteX should look like a:

> Professional traffic simulation and engineering research platform.

The visual language may have a subtle cyberpunk influence, but RouteX must remain professional.

Think:

```text
Engineering Dashboard
+
Data Visualization
+
Modern Developer Tool
+
Subtle Cyberpunk
```

Not:

```text
Gaming HUD
```

---

# 2. Visual Personality

RouteX should feel:

- Technical
- Modern
- Precise
- Intelligent
- Clean
- Data-driven
- Professional

Avoid excessive visual noise.

---

# 3. Color Direction

Primary visual direction:

- Dark interface
- Blue/purple accents
- Neutral backgrounds
- High readability
- Clear status colors

Traffic status colors should have semantic meaning.

Conceptually:

```text
Low congestion       → Normal
Medium congestion    → Warning
High congestion      → Critical
Road closed          → Closed
Emergency            → Emergency
```

Do not use colors purely for decoration when they communicate system state.

---

# 4. Typography

Typography should prioritize:

1. Readability
2. Information density
3. Clear hierarchy

Use clear hierarchy:

```text
Page title
    ↓
Section title
    ↓
Component title
    ↓
Body
    ↓
Metadata
```

Avoid excessively large headings.

RouteX is a technical dashboard, not a marketing landing page.

---

# 5. Layout

Primary application structure:

```text
┌──────────────────────────────────────────┐
│ Header                                   │
├─────────────┬────────────────────────────┤
│             │                            │
│ Sidebar     │ Main Content               │
│             │                            │
│ Navigation  │                            │
│             │                            │
└─────────────┴────────────────────────────┘
```

The simulation page may use:

```text
┌────────────────────────────────────────────┐
│ Simulation Header                          │
├───────────────┬────────────────────────────┤
│ Controls      │                            │
│               │       PixiJS Canvas        │
│ Scenario      │                            │
│ Algorithm     │                            │
│ Speed         │                            │
│               │                            │
├───────────────┴────────────────────────────┤
│ Metrics                                     │
└────────────────────────────────────────────┘
```

---

# 6. Navigation

Primary sections:

- Dashboard
- Simulations
- Scenarios
- Networks
- Algorithms
- Benchmarks
- Analytics
- Settings

Navigation should remain consistent across the application.

---

# 7. Components

Prefer reusable components.

Common components:

- Button
- Card
- Badge
- Dialog
- Dropdown
- Tabs
- Tooltip
- Data table
- Chart
- Metric card
- Status indicator

Do not create one-off components when an existing component can be reused.

---

# 8. Simulation Canvas

The PixiJS simulation should be the primary visual element of the simulation page.

It should clearly communicate:

- Road layout
- Vehicle movement
- Congestion
- Traffic lights
- Selected routes
- Incidents

Do not overwhelm the map with decorative effects.

---

# 9. Vehicles

Vehicles should be visually distinguishable without requiring excessive animation.

Emergency vehicles must be clearly identifiable.

Selecting a vehicle should provide useful information such as:

- Vehicle ID
- Origin
- Destination
- Current road
- Current route
- Speed
- Estimated travel time

---

# 10. Roads

Road appearance should communicate traffic conditions.

Road state should be understandable at a glance.

Possible states:

```text
Normal
Congested
Highly Congested
Closed
Incident
```

---

# 11. Metrics

Metrics should be visible during or after simulation.

Important metrics:

- Vehicles
- Average speed
- Average travel time
- Congestion
- Throughput
- Waiting time
- Completed vehicles

Use charts when trends matter.

Use metric cards when a single current value matters.

---

# 12. Benchmark UI

Benchmark results should make comparisons easy.

Example:

```text
Algorithm       Travel Time    Congestion    Runtime
----------------------------------------------------
Dijkstra        ...
A*              ...
Dynamic A*      ...
```

Use actual measured results.

Avoid decorative charts that do not communicate meaningful information.

---

# 13. Interaction Rules

Interactions should be predictable.

Buttons should clearly communicate:

- Start
- Pause
- Stop
- Reset
- Save
- Load
- Export

Destructive operations should require confirmation when appropriate.

---

# 14. Loading States

Never leave users wondering whether the application is working.

Use appropriate:

- Loading indicators
- Progress indicators
- Skeleton states
- Status messages

---

# 15. Error States

Errors should explain:

1. What happened
2. Why it happened when known
3. What the user can do next

Avoid technical errors such as raw stack traces in the UI.

---

# 16. Accessibility

The UI should follow good accessibility practices.

Prioritize:

- Keyboard navigation
- Semantic HTML
- Visible focus states
- Sufficient contrast
- Accessible labels
- Non-color-only status communication
- Reduced-motion consideration

---

# 17. Responsive Design

The primary target is desktop.

However, the UI should not completely break at smaller widths.

The simulation canvas should adapt gracefully.

Do not sacrifice the desktop simulation experience merely to support mobile.

---

# 18. Animation

Use animation to communicate:

- State changes
- Simulation movement
- Loading
- Transitions

Do not animate everything.

Avoid:

- Constant pulsing
- Excessive glow
- Excessive particle effects
- Distracting transitions

---

# 19. Design Consistency

Before creating a new UI component, check whether an existing component can be reused.

Before creating a new color, check whether an existing semantic color can be reused.

Before creating a new spacing value, follow the existing spacing system.

Consistency is more important than visual novelty.

---

# 20. Design Rule

Every visual decision should serve one of:

- Understanding
- Navigation
- Feedback
- Comparison
- Data interpretation

If it does none of these, it probably does not belong in the UI.
