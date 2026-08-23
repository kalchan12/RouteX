---
name: traffic-simulation
description: RouteX-specific skill for implementing realistic 2D traffic simulation behavior.
---

# RouteX Traffic Simulation Skill

## Purpose

This skill defines how realistic traffic behavior should be implemented in RouteX.

RouteX is a traffic simulation and algorithm evaluation platform.

The goal is realistic and explainable traffic behavior, NOT full vehicle physics.

---

# 1. Read Before Using This Skill

Read:

- AGENT.md
- PROJECT.md
- ARCHITECTURE.md
- DESIGN.md
- PLAN.md

Inspect the existing simulation implementation before modifying it.

---

# 2. Core Principle

The graph is the mathematical model.

The simulation is the behavior model.

PixiJS is the visual model.

Keep these separate.

---

# 3. Simulation Loop

The simulation should conceptually follow:

Simulation Tick
    ↓
Update Clock
    ↓
Process Events
    ↓
Update Traffic Lights
    ↓
Update Vehicles
    ↓
Calculate Traffic Conditions
    ↓
Update Metrics
    ↓
Publish State

Do not put rendering logic into this loop.

---

# 4. Vehicle Model

A vehicle should eventually contain concepts such as:

- ID
- Type
- Position
- Speed
- Maximum speed
- Acceleration
- Braking
- Current road
- Current lane
- Route
- Destination
- State

Possible states:

- MOVING
- SLOWING
- STOPPED
- WAITING
- TURNING
- ARRIVED

Only implement fields that are actually required.

---

# 5. Vehicle Movement

Vehicles should:

1. Follow their assigned route.
2. Move along roads.
3. Respect road direction.
4. Slow when approaching obstacles.
5. Stop when required.
6. Resume movement when conditions permit.
7. Turn at intersections.
8. Detect arrival at destinations.

Avoid teleporting vehicles directly between graph nodes.

---

# 6. Acceleration and Braking

Use a simplified traffic model.

The objective is believable behavior.

It is NOT necessary to implement full vehicle physics.

A vehicle may have:

- Current speed
- Target speed
- Acceleration
- Deceleration

Movement should change smoothly.

Avoid visually unrealistic:

speed = maxSpeed

for every tick.

---

# 7. Following Vehicles

Vehicles should eventually react to vehicles ahead.

Basic behavior:

Vehicle ahead is far away
    ↓
Continue

Vehicle ahead becomes closer
    ↓
Reduce speed

Vehicle ahead is stopped
    ↓
Stop

Vehicle ahead moves
    ↓
Resume

Keep the initial model simple.

---

# 8. Traffic Lights

Traffic lights control intersection movement.

States:

RED
YELLOW
GREEN

Vehicles should:

- Stop at red
- Prepare/slow at yellow
- Proceed at green when safe

Traffic-light behavior belongs to the simulation core.

PixiJS only displays it.

---

# 9. Lanes

Where practical, roads should support lane concepts.

A lane may define:

- Direction
- Capacity
- Vehicles
- Speed constraints

Do not build a complicated lane-management system until the simulation requires it.

---

# 10. Congestion

Congestion should be calculated from measurable simulation state.

Possible inputs:

- Vehicle count
- Road capacity
- Average speed
- Occupancy
- Waiting time

Do not create random congestion values merely for visual effect.

---

# 11. Dynamic Routing

Dynamic routing may react to:

- Congestion
- Road closures
- Accidents
- Travel-time changes

Do not reroute every vehicle every tick.

Use sensible triggers or intervals.

---

# 12. Incidents

Incidents may include:

- Accident
- Road closure
- Construction
- Emergency event

An incident should modify the simulation.

For example:

Road closure
    ↓
Road unavailable
    ↓
Existing vehicles react
    ↓
New routes may be calculated

Do not merely display an accident icon without changing simulation behavior.

---

# 13. Emergency Vehicles

Emergency vehicles should be treated as a special vehicle type.

Possible future behavior:

- Priority routing
- Traffic-light priority
- Reduced stopping
- Emergency response metrics

Do not implement all emergency behavior at once.

---

# 14. Pedestrians

Pedestrians are a secondary simulation system.

Initial behavior should be simple:

Sidewalk
    ↓
Wait at crossing
    ↓
Cross when permitted
    ↓
Continue

Do not implement complex pedestrian AI initially.

---

# 15. Determinism

Where practical, simulation scenarios should support reproducibility.

A scenario should be able to use a fixed random seed.

This is important for:

- Algorithm comparison
- Benchmarking
- Academic evaluation
- Debugging

---

# 16. Metrics

Simulation metrics should come from actual simulation state.

Important metrics include:

- Average travel time
- Waiting time
- Average speed
- Congestion
- Throughput
- Completed vehicles
- Road utilization

Never fabricate benchmark values.

---

# 17. Performance

Do not prematurely optimize.

First make behavior correct.

If simulation performance becomes a problem:

1. Measure it.
2. Identify the bottleneck.
3. Optimize the bottleneck.
4. Re-test.

Possible future optimization:

- Spatial indexing
- Object pooling
- Web Worker simulation
- Reduced update frequency
- Efficient route calculations

---

# 18. Academic Explainability

Traffic behavior should be understandable enough to explain in the capstone.

Prefer algorithms and rules that can be documented.

Avoid opaque behavior unless it is explicitly part of an AI/ML experiment.

---

# 19. Completion Criteria

A traffic simulation task is complete when:

- Behavior is implemented
- Behavior is deterministic where required
- Relevant tests exist
- Metrics reflect actual behavior
- Rendering reflects simulation state
- No logic was incorrectly placed in PixiJS
- Build passes
- PLAN.md is updated
