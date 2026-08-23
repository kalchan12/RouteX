---
name: pixijs-simulation
description: RouteX-specific PixiJS skill for building the 2D animated traffic simulation renderer.
---

# RouteX PixiJS Simulation Skill

## Purpose

This skill defines how PixiJS must be used inside RouteX.

RouteX uses PixiJS as the visual rendering layer for the traffic simulation.

PixiJS is responsible for displaying the simulation.

It is NOT responsible for implementing the simulation itself.

---

# 1. Read Before Using This Skill

Before making changes, read:

- AGENT.md
- PROJECT.md
- ARCHITECTURE.md
- DESIGN.md
- PLAN.md

Then inspect the existing PixiJS implementation.

Do not assume the documented architecture exactly matches the source code.

---

# 2. Rendering Boundary

The architectural relationship is:

React
    ↓
Simulation State
    ↓
Simulation Engine
    ↓
PixiJS Renderer

The simulation engine owns:

- Vehicle state
- Vehicle position
- Speed
- Routes
- Traffic lights
- Road state
- Incidents
- Simulation time

PixiJS only visualizes those states.

---

# 3. PixiJS Responsibilities

PixiJS may handle:

- Roads
- Lanes
- Intersections
- Vehicles
- Pedestrians
- Traffic lights
- Routes
- Incidents
- Visual congestion
- Selection highlights
- Camera movement
- Zoom
- Pan
- Animation

PixiJS must NOT contain:

- Dijkstra implementation
- A* implementation
- Traffic optimization algorithms
- Business rules
- Database logic
- Scenario persistence
- Analytics calculations

---

# 4. Rendering Architecture

Prefer a structure similar to:

src/rendering/pixi/

Possible modules:

- CityScene
- RoadRenderer
- LaneRenderer
- VehicleRenderer
- PedestrianRenderer
- TrafficLightRenderer
- IncidentRenderer
- RouteRenderer
- Camera

Adapt this structure to the existing project.

Do not create unnecessary files.

---

# 5. Simulation-to-Renderer Flow

The preferred flow is:

Simulation Engine
    ↓
Simulation State
    ↓
Renderer
    ↓
Pixi Objects

Example:

Simulation:

vehicle.position = { x, y }

Renderer:

vehicleSprite.position = vehicle.position

The renderer should not calculate a vehicle's route.

---

# 6. Vehicles

Vehicles should visually communicate:

- Position
- Direction
- Vehicle type
- Movement state
- Selected state

Vehicle rendering should support:

- Cars
- Buses
- Trucks
- Emergency vehicles

Do not create a complex vehicle asset system prematurely.

Start with simple clean sprites or vector graphics.

---

# 7. Movement

Vehicle movement must be driven by simulation state.

Do not create independent visual movement that contradicts the simulation.

Bad:

Pixi animation moves a car independently of simulation state.

Good:

Simulation updates vehicle position.

Pixi renders the resulting position.

---

# 8. Traffic Lights

Traffic-light visuals must reflect actual simulation state.

Possible states:

- RED
- YELLOW
- GREEN

Never fake traffic-light state purely for animation.

---

# 9. Roads

Road rendering should communicate:

- Road geometry
- Lanes
- Direction
- Road state
- Congestion

Possible states:

- OPEN
- CONGESTED
- INCIDENT
- CLOSED

The exact visual representation must follow DESIGN.md.

---

# 10. Performance

RouteX may eventually display many moving objects.

Avoid:

- Creating/destroying sprites every simulation tick
- Excessive React re-renders
- One React component per vehicle
- Expensive calculations inside rendering loops

Prefer:

- Reusing Pixi objects
- Updating positions efficiently
- Batching where practical
- Keeping high-frequency updates outside React

Optimize only when there is evidence of a performance problem.

---

# 11. React Integration

React owns the application UI.

Pixi owns the simulation canvas.

Do not force every Pixi object through React state.

Use React for:

- Controls
- Panels
- Metrics
- Scenario selection
- Settings

Use Pixi for:

- High-frequency simulation visualization

---

# 12. Camera

The simulation should eventually support:

- Pan
- Zoom
- Centering
- Reset view

Do not add a large camera abstraction unless needed.

---

# 13. Visual Style

Follow DESIGN.md.

RouteX should look:

- Professional
- Technical
- Modern
- Data-driven
- Subtly cyberpunk

Avoid making it look like an arcade game.

---

# 14. Implementation Rule

When adding PixiJS functionality:

1. Check whether simulation state already exists.
2. Reuse existing state.
3. Create the smallest rendering layer required.
4. Keep simulation logic outside the renderer.
5. Test the simulation independently.
6. Verify visual behavior manually.

---

# 15. Completion Criteria

A PixiJS task is complete when:

- Rendering works
- Simulation state is correctly represented
- No simulation logic was incorrectly moved into rendering
- Existing UI still works
- Relevant tests pass
- Build passes
- Documentation is updated if architecture changed
- PLAN.md is updated
