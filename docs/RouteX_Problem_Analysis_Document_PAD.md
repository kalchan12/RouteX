# PROBLEM ANALYSIS DOCUMENT (PAD)
## RouteX: Intelligent Traffic & Route Optimization Simulator
### High-Fidelity Microscopic Traffic Simulation, Dynamic Graph Pathfinding, and Comparative Algorithmic Benchmarking Platform

---

**Document Type:** Software Requirements Specification (SRS) & Problem Analysis Document (PAD)  
**Academic Program:** Bachelor of Science in Computer Science and Engineering (CSE) / Software Engineering (SE)  
**Course Code:** CSE/SE 490 — Senior Capstone Design Project  
**Deliverable:** Capstone Deliverable I (Evaluation Weight: 27%)  
**Document Version:** 2.0.0 (Final Academic Specification)  
**Date of Submission:** September 2026  
**Target Classification:** Academic Engineering Defense & Open-Source Research  

---

## Executive Metadata & Team Hierarchy

| Role in Project | Engineering Discipline | Primary Technical Focus & Workstream Ownership |
|---|---|---|
| **Project Coordinator & Scrum Master** | Software Engineering / PM | Agile sprint lifecycle management, Faculty Supervisor liaison, milestone tracking, risk governance. |
| **Lead Systems Architect & Core Developer** | Systems Engineering / CSE | Decoupled discrete-time simulation engine, clock synchronization, snapshot pipeline, state orchestration. |
| **Lead Algorithms & Optimization Engineer** | Computer Science / Algorithms | Directed multigraph topology, Dijkstra, A* with admissible Euclidean heuristic, dynamic hierarchical routing. |
| **Traffic Simulation & Physics Specialist** | Computational Modeling / CSE | Intelligent Driver Model (IDM), MOBIL lane changing, Social Force pedestrian dynamics, gap acceptance. |
| **3D Graphics & Rendering Architect** | Interactive Systems / SE | Three.js WebGL rendering pipeline, camera coordinate transformations, procedural road/mesh geometry. |
| **QA Lead & Test Automation Engineer** | Software Quality Assurance / SE | Test-Driven Development (TDD), Vitest unit/integration harness, Playwright E2E testing, code coverage (>85%). |
| **Data Persistence & Concurrency Engineer** | Systems & Database / CSE | Dexie.js / IndexedDB BCNF relational schema, client ACID transactions, Web Worker multithreading offload. |
| **Frontend Architect & Documentation Specialist** | Software Systems / SE | React 18 UI shell, Tailwind CSS, shadcn/ui, Recharts telemetry dashboards, formal IEEE 830 SRS documentation. |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
   - 1.1 Project Overview & Vision
   - 1.2 Core Mission & Value Proposition
   - 1.3 Key Architectural Innovations
2. [Problem Statement, Industrial Context & Theoretical Justification](#2-problem-statement-context--theoretical-justification)
   - 2.1 The Global Crisis in Urban Mobility & Intelligent Transportation Systems
   - 2.2 Formal Problem Definition: The Three Structural Deficiencies in Traffic Simulation
   - 2.3 Significance to Computer Science & Systems Engineering
   - 2.4 Expected Impact & Scientific Value
3. [SMART Project Objectives & Scope Boundaries](#3-smart-project-objectives--scope-boundaries)
   - 3.1 Primary SMART Engineering Objectives
   - 3.2 Secondary Operational & Academic Objectives
   - 3.3 Scope Delimitations & Explicit Non-Goals
4. [System Requirements Specification (SRS - IEEE 830 Aligned)](#4-system-requirements-specification-srs)
   - 4.1 Stakeholder Analysis & User Personas
   - 4.2 Comprehensive Functional Requirements (FR-01 to FR-20)
   - 4.3 Non-Functional Requirements (NFR-01 to NFR-15)
   - 4.4 User, Data & Environment Interfaces
5. [Methodology, Architecture & Technical Approach](#5-methodology-architecture--technical-approach)
   - 5.1 Decoupled Layered System Topology
   - 5.2 Microscopic Discrete-Time Simulation Loop
   - 5.3 Low-Level Subsystem Breakdown
   - 5.4 Graph-Based Road Network Modeling & Topological Data Flow
   - 5.5 High-Frequency Three.js Rendering & Scene Graph Decoupling
6. [Technical Rigor: Advanced CSE/SE Concept Synthesis](#6-technical-rigor-advanced-csese-concept-synthesis)
   - 6.1 Domain 1: Data Structures, Advanced Graph Theory & Computational Complexity
   - 6.2 Domain 2: Continuous & Discrete Simulation Physics (IDM, MOBIL, Social Force)
   - 6.3 Domain 3: Systems Architecture & Database Theory (BCNF / IndexedDB ACID Transactions)
   - 6.4 Domain 4: Operating Systems, Concurrency & Multithreaded Web Workers
   - 6.5 Domain 5: Software Quality Assurance, TDD & Verification Metrics
   - 6.6 Domain 6: Cybersecurity Engineering & Formal Threat Modeling (STRIDE Analysis)
   - 6.7 Domain 7: Professional Ethics, Social Responsibility & Ethical Impact Analysis (EIA)
7. [Mathematical Formulations & Algorithmic Specifications](#7-mathematical-formulations--algorithmic-specifications)
   - 7.1 Mathematical Formulation: Intelligent Driver Model (IDM)
   - 7.2 Mathematical Formulation: MOBIL Autonomous Lane-Changing Criterion
   - 7.3 Mathematical Formulation: Social Force Model for Pedestrian Crowd Dynamics
   - 7.4 Algorithmic Specification: Admissible Heuristic A* Shortest Path Search
   - 7.5 Algorithmic Specification: Dynamic Hierarchical Multi-Level Routing (`dynamic_hld`)
   - 7.6 Mathematical Formulation: Bureau of Public Roads (BPR) Congestion Cost Function
8. [Team Organization, Professional Roles, WBS & Schedule](#8-team-organization-professional-roles-wbs--schedule)
   - 8.1 Professional Engineering Team Structure
   - 8.2 Work Breakdown Structure (WBS)
   - 8.3 Capstone Milestone Roadmap & Delivery Timeline (Weeks 1 to 14)
9. [Comprehensive Technical Risk Analysis & Mitigation Engineering](#9-comprehensive-technical-risk-analysis--mitigation-engineering)
   - 9.1 Risk Identification, Likelihood & Impact Matrix
   - 9.2 Failure Modes and Effects Analysis (FMEA)
   - 9.3 Contingency & Disaster Recovery Procedures
10. [System Verification, Validation & Empirical Performance Matrix](#10-system-verification-validation--empirical-performance-matrix)
    - 10.1 Automated Verification Harness Architecture
    - 10.2 Empirical Benchmarking Suite & Scenario Execution Matrix
    - 10.3 Requirements Traceability & Verification Matrix (RTM)
11. [References & Appendices](#11-references--appendices)
    - 11.1 Academic & Technical Literature References
    - 11.2 Appendix A: Complete Dexie.js / IndexedDB Relational Schema DDL
    - 11.3 Appendix B: Canonical Scenario Configuration Schema (Zod)

---

## 1. Executive Summary

### 1.1 Project Overview & Vision
Urban traffic gridlock generates severe socioeconomic penalties worldwide, including billions of wasted commuter hours, excessive fuel consumption, elevated greenhouse gas emissions, and degraded emergency response times. Developing and validating Intelligent Transportation Systems (ITS), adaptive signal control mechanisms, and dynamic vehicle routing algorithms is vital to modern urban engineering. However, evaluating algorithmic routing strategies directly on real-world municipal road networks is prohibitively expensive, operationally hazardous, and mathematically intractable due to the impossibility of enforcing identical, reproducible traffic boundary conditions.

**RouteX** is an advanced, local-first, browser-based microscopic traffic simulation and algorithmic benchmarking platform engineered specifically for computer science and software engineering research. RouteX synthesizes core curriculum concepts—spanning graph theory, discrete-time physical modeling, client-side relational database systems, asynchronous multi-threading, and computer graphics—into an interactive, zero-installation academic laboratory. 

```
                                  +--------------------------------------------------+
                                  |                     RouteX UI                    |
                                  |    (React 18 + Vite + Tailwind CSS + Recharts)   |
                                  +------------------------+-------------------------+
                                                           | UI State / Actions
                                                           v
                                  +--------------------------------------------------+
                                  |            Zustand Store Layer                   |
                                  |     (Telemetry, Playback, Scenario Selection)    |
                                  +------------+-----------------------+-------------+
                                               |                       |
                     Read-Only Snapshots (60Hz)|                       | Direct Engine Control
                                               v                       v
+-----------------------------+   +------------------------+   +----------------------------------+
|      Three.js Renderer      |   |  Web Worker Simulation |<--+      Simulation Core Engine      |
|  (WebGL Scene Graph, Meshes,|   |   (High-Load Thread)   |   |   (Tick: 10Hz, Clock, Events)    |
|   Instanced 3D Rendering)   |   +------------------------+   +-----------------+----------------+
+-----------------------------+                                                  |
                                                                                 | Updates / Queries
                                                                                 v
                                                               +----------------------------------+
                                                               |     Microscopic Physics Core     |
                                                               | - IDM Car-Following Model        |
                                                               | - MOBIL Autonomous Lane-Changing |
                                                               | - Social Force Pedestrian Model  |
                                                               | - Actuated Signal Controllers    |
                                                               +-----------------+----------------+
                                                                                 |
                                                                                 | Evaluates Network
                                                                                 v
                                                               +----------------------------------+
                                                               |     Graph & Routing Engine       |
                                                               | - Directed Multigraph G = (V, E) |
                                                               | - Dijkstra (Dynamic Travel Time) |
                                                               | - A* (Euclidean Admissible)      |
                                                               | - Dynamic Hierarchical Routing   |
                                                               +-----------------+----------------+
                                                                                 |
                                                                                 | Telemetry & Logs
                                                                                 v
                                                               +----------------------------------+
                                                               |   Dexie.js / IndexedDB Storage   |
                                                               | - Networks, Scenarios, Runs      |
                                                               | - Benchmarking Data (BCNF ACID)  |
                                                               +----------------------------------+
```

### 1.2 Core Mission & Value Proposition
The primary mission of RouteX is to provide a mathematically rigorous, fully deterministic, and experimentally reproducible traffic testbed. The fundamental scientific lifecycle realized by the platform is:

$$\text{Simulate} \longrightarrow \text{Route} \longrightarrow \text{Optimize} \longrightarrow \text{Measure} \longrightarrow \text{Compare}$$

The value proposition of RouteX rests upon five architectural pillars:
1. **Mathematical Determinism:** Every simulation run can be seeded with an exact pseudorandom state, ensuring that routing algorithms (Dijkstra, $A^*$, Dynamic HLD) are benchmarked against *strictly identical* vehicle arrival rates, driver behaviors, and stochastic road incidents.
2. **True Microscopic Behavioral Modeling:** Vehicles do not jump instantaneously between graph nodes. Instead, vehicles navigate continuous spatial trajectories via the Intelligent Driver Model (IDM) for longitudinal acceleration and the MOBIL model for lateral lane-changing decisions, interacting with pedestrian crowds governed by the Social Force Model.
3. **Hardware-Accelerated WebGL Visualization:** High-performance 3D rendering powered by Three.js allows researchers to visually inspect bottlenecks, shockwave propagation, signal queue accumulation, and emergency vehicle lane-clearing maneuvers in real-time.
4. **Local-First Zero-Backend Architecture:** Bypassing cumbersome cloud servers, databases, and Docker dependencies, RouteX executes entirely in client-side WebAssembly/TypeScript and persists telemetry to IndexedDB via Dexie.js. It operates completely offline, eliminating hosting costs, latency, and remote privacy concerns.
5. **Headless Experimental Benchmarking:** Researchers can execute high-speed, headless multi-run benchmarks across standardized scenarios (Normal Flow, Morning Rush Hour, Major Arterial Incident, Unannounced Road Closure, and Emergency Priority Corridor) to collect verifiable statistical comparisons.

### 1.3 Key Architectural Innovations
- **Strict Decoupling of Simulation and Visualization:** The simulation engine runs as a pure mathematical clock loop ($\Delta t = 0.1s$ / $10Hz$) completely detached from the DOM and rendering loops ($60\text{--}120Hz$), preventing UI rendering lag from distorting physical simulation fidelity.
- **Pluggable Dynamic Impedance Cost Functions:** Routing algorithms consume edge impedance dynamically parameterized by real-time speed drops, congestion ratios, lane-blocking incidents, and intersection turn delays.
- **Multimodal Agent Dynamics:** Seamlessly models four vehicular classes (Cars, Heavy Trucks, Transit Buses, Emergency Vehicles) alongside pedestrian crowds at signalized crosswalks.
- **Client-Side Analytical Telemetry Warehouse:** In-memory circular time-series buffers synchronized with persistent IndexedDB tables enable millisecond-precision metric tracking without garbage collection thrashing.

---

## 2. Problem Statement, Industrial Context & Theoretical Justification

### 2.1 The Global Crisis in Urban Mobility & Intelligent Transportation Systems
Urbanization has outpaced municipal infrastructure development globally. The Texas A&M Transportation Institute's Urban Mobility Report estimates that traffic congestion costs the United States economy alone over $190 billion annually in lost productivity, wasted fuel (3.3 billion gallons), and environmental carbon emissions. Beyond economic disruption, traffic delays directly jeopardize human life: emergency medical services (EMS) experiencing an additional 3-minute transit delay suffer statistically significant increases in trauma mortality rates.

Municipalities have attempted to mitigate congestion through Intelligent Transportation Systems (ITS), including dynamic routing displays, ramp metering, and adaptive traffic signal timing. However, optimizing these systems requires extensive algorithmic testing under variable traffic densities, fluctuating demand spikes, unexpected lane closures, and multi-vehicle collisions.

### 2.2 Formal Problem Definition: The Three Structural Deficiencies in Traffic Simulation
Existing tools for traffic modeling and routing research suffer from three critical structural deficiencies:

1. **Deficiency 1: The Macro-Micro Chasm (Coarse Graph Abstraction vs. Hyper-Complex Tools):**
   Standard computer science implementations of pathfinding algorithms (such as classroom Dijkstra or $A^*$) operate on static, instantaneous graphs where edge costs are constant lengths and nodes are crossed instantaneously. In reality, roads possess dynamic capacities, shockwave deceleration profiles, and non-linear delays. Conversely, industry-standard microscopic simulators (e.g., PTV VISSIM, AIMSUN, SUMO) are monolithic, closed-source or difficult to install, possess steep learning curves, require heavy desktop compilation, and offer opaque routing integration that prevents rapid comparative algorithm benchmarking.

2. **Deficiency 2: Experimental Non-Reproducibility and Confounding Variables:**
   Benchmarking dynamic routing algorithms requires that two distinct algorithms experience the *exact same* physical environment: the identical sequence of vehicle spawns, the same driver aggressiveness distributions, and identical traffic light phase alignments. Field trials and poorly constrained multi-agent simulators introduce confounding stochastic variations, invalidating comparative performance claims.

3. **Deficiency 3: Cloud Infrastructure Over-Engineering & Accessibility Barriers:**
   Modern research software frequently requires containerized server infrastructure, remote relational databases, and expensive cloud compute clusters. This introduces severe barriers for university students, educators, and independent researchers who need an immediate, local, responsive environment to test new heuristics without cloud billing or network latency.

```
+-----------------------------------------------------------------------------------+
|                        THE THREE STRUCTURAL DEFICIENCIES                          |
+------------------------------------+----------------------------------------------+
| Structural Deficiency              | Manifestation & Impact                       |
+------------------------------------+----------------------------------------------+
| 1. The Macro-Micro Chasm           | Traditional pathfinding treats roads as      |
|                                    | static edges; monolithic enterprise tools    |
|                                    | (VISSIM/SUMO) are inaccessible and rigid.    |
|                                    |                                              |
| 2. Non-Reproducibility             | Stochastic variations in traffic generation  |
|                                    | make it impossible to prove whether route A  |
|                                    | is superior to route B under identical load. |
|                                    |                                              |
| 3. Deployment & Cloud Barrier      | Cloud backends create latency, configuration |
|                                    | friction, hosting costs, and lockouts.       |
+------------------------------------+----------------------------------------------+
```

### 2.3 Significance to Computer Science & Systems Engineering
From a computer science and engineering perspective, traffic simulation is a rigorous intersection of multiple classical subfields:
- **Graph Theory & Dynamic Network Flow:** Modeling roadway topology as a directed multigraph $G = (V, E)$ where edge weights $w(e, t)$ vary continuously as a function of instantaneous vehicle density and downstream bottlenecks.
- **Differential Equations & Numerical Integration:** Evaluating non-linear car-following equations (IDM) using Euler integration within discrete computational time steps.
- **Computational Geometry & Spatial Hashing:** Detecting proximity, blind-spot incursions, and pedestrian collision cones across hundreds of dynamic entities in real-time.
- **Software Architecture & Decoupling:** Designing clean separation of concerns between state mutation, mathematical physics, user event handling, and 60 FPS GPU rendering.

### 2.4 Expected Impact & Scientific Value
RouteX resolves these deficiencies by democratizing high-fidelity microscopic simulation. Running natively within modern standards-compliant web browsers via WebAssembly and TypeScript, RouteX allows students, algorithms engineers, and urban planners to configure custom road topologies, run standardized stress scenarios, and generate publishable, mathematically rigorous comparisons of pathfinding efficiency, network throughput, travel delays, and carbon emission proxies.

---

## 3. SMART Project Objectives & Scope Boundaries

### 3.1 Primary SMART Engineering Objectives
To ensure rigorous academic evaluation and empirical accountability, RouteX establishes the following Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) objectives:

- **SMART Objective 1 (Microscopic Physics Fidelity):** Implement the Intelligent Driver Model (IDM) and MOBIL lane-change model with continuous spatial coordinate tracking ($x, y$ position, velocity, acceleration), supporting at least **250 concurrent dynamic vehicles** running at a stable **$\ge 10\text{ Hz}$** simulation tick rate without frame drops or physics stutter.
- **SMART Objective 2 (Deterministic Reproducibility):** Guarantee **100% deterministic simulation playback** when initialized with an identical pseudorandom seed and scenario configuration, producing identical vehicle trajectories, travel times, and benchmark telemetry across consecutive runs.
- **SMART Objective 3 (Comparative Pathfinding Engine):** Implement from scratch and benchmark at least three algorithmic routing approaches—Dijkstra's Algorithm, $A^*$ Search with an admissible Euclidean heuristic, and Dynamic Hierarchical Multi-Level Routing (`dynamic_hld`)—demonstrating statistically measurable improvements in compute latency and travel time under congested states.
- **SMART Objective 4 (Standardized Scenario Benchmarking):** Deliver five pre-configured, validated benchmark scenarios (Normal Flow, Rush Hour Gridlock, Arterial Incident, Major Construction Closure, and Emergency Priority Dispatch) with automated headless execution capability, computing execution time, average velocity, throughput, and total delay within $\le 5$ seconds per 1,000-tick test run.
- **SMART Objective 5 (Local-First Data Sovereignty & Performance):** Implement zero-backend local persistence using Dexie.js and IndexedDB in full Boyce-Codd Normal Form (BCNF), allowing scenario creation, network editing, and benchmark history export/import with zero external API calls or network requests.
- **SMART Objective 6 (Test Automation & Code Coverage):** Achieve $\ge 85\%$ line and branch test coverage across all mathematical models, graph traversal algorithms, and state mutations using Vitest, corroborated by Playwright end-to-end (E2E) browser verification.

### 3.2 Secondary Operational & Academic Objectives
- Provide an interactive 3D WebGL visualization pipeline using Three.js displaying roads, multi-lane markings, buildings, animated signal heads, vehicles with brake-light indications, and crossing pedestrians.
- Build an intuitive Dispatch & Incident Management dock allowing researchers to inject live accidents, close lanes, trigger emergency vehicles, and modify traffic signal splits during runtime.
- Deliver comprehensive telemetry visualization (Recharts) plotting real-time velocity distributions, queue lengths, vehicle count, and algorithmic execution time series.

### 3.3 Scope Delimitations & Explicit Non-Goals
To maintain engineering focus and deliver architectural perfection within the Capstone timeframe, the following boundaries are formally established:

| Included in RouteX Scope (IN-SCOPE) | Explicitly Excluded from Scope (OUT-OF-SCOPE) |
|---|---|
| Microscopic car-following (IDM) & lane changing (MOBIL). | Real-world global GPS turn-by-turn navigation (Google Maps clone). |
| Top-down 3D synthetic grid & arterial networks. | Ingestion of multi-gigabyte OpenStreetMap planetary satellite GIS data. |
| Deterministic synthetic scenario generation. | Real-time live municipal traffic camera ingestion / cloud scraping. |
| In-browser client-side IndexedDB persistence. | Cloud-hosted multi-tenant SaaS backend with PostgreSQL/Kubernetes. |
| Algorithmic comparison of Dijkstra, A*, and Dynamic HLD. | Hardware-in-the-loop (HIL) traffic controller physical wiring. |
| Pedestrian crosswalk interaction (Social Force Model). | Full autonomous vehicle LIDAR sensor simulation or computer vision. |

---

## 4. System Requirements Specification (SRS - IEEE 830 Aligned)

### 4.1 Stakeholder Analysis & User Personas
1. **Academic Researcher / Transportation Engineer (Dr. Elena Vance):** Needs a controlled, reproducible testbed to evaluate new adaptive signal timing and congestion-pricing routing heuristics without configuring complex enterprise software.
2. **Computer Science Student / Algorist (Marcus Chen):** Studying graph algorithms and desires visual, empirical feedback comparing $A^*$ heuristic expansion patterns against standard Dijkstra under fluctuating dynamic edge weights.
3. **Emergency Dispatch Planner (Chief Robert Taylor):** Investigating how dynamic rerouting and signal preemption affect ambulance transit times during catastrophic arterial lane closures.

### 4.2 Comprehensive Functional Requirements (FR-01 to FR-20)

```
+-----------------------------------------------------------------------------------+
|                        FUNCTIONAL REQUIREMENTS MATRIX                             |
+---------+----------------------------------+----------+---------------------------+
| ID      | Requirement Name                 | Priority | Verification Method       |
+---------+----------------------------------+----------+---------------------------+
| FR-01   | Graph Topology Construction      | Mandatory| Unit Test (network.test)  |
| FR-02   | Multi-Lane Road Attributes       | Mandatory| Unit Test (network.test)  |
| FR-03   | Discrete-Time Simulation Loop    | Mandatory| Unit Test (sim.test)      |
| FR-04   | IDM Longitudinal Acceleration    | Mandatory| Unit Test (physics.test)  |
| FR-05   | MOBIL Lateral Lane Changes       | Mandatory| Unit Test (physics.test)  |
| FR-06   | Social Force Pedestrian Crowd    | Mandatory| Unit Test (sf.test)       |
| FR-07   | Unsignalized Gap Acceptance      | Mandatory| Unit Test (gap.test)      |
| FR-08   | Actuated Traffic Signal Control  | Mandatory| Unit Test (traffic.test)  |
| FR-09   | Dijkstra Dynamic Pathfinding     | Mandatory| Unit Test (routing.test)  |
| FR-10   | Admissible Heuristic A* Search   | Mandatory| Unit Test (routing.test)  |
| FR-11   | Dynamic Hierarchical Routing     | Mandatory| Unit Test (routing.test)  |
| FR-12   | Real-Time Edge Congestion Metric | Mandatory| Unit Test (traffic.test)  |
| FR-13   | Stochastic Incident Injection    | Mandatory| Integration Test          |
| FR-14   | Emergency Vehicle Priority Mode  | Mandatory| Integration Test          |
| FR-15   | Standardized Scenario Selection  | Mandatory| E2E Test (smoke.spec)     |
| FR-16   | Headless Algorithmic Benchmark   | Mandatory| Integration Benchmark     |
| FR-17   | Three.js 3D Scene Visualization  | Mandatory| System Visual Test        |
| FR-18   | Real-Time Telemetry Dashboard    | Mandatory| Component Test (React)    |
| FR-19   | Dexie.js / IndexedDB Persistence | Mandatory| Integration Test (DB)     |
| FR-20   | JSON Scenario Import/Export      | Mandatory| Schema Validation (Zod)   |
+---------+----------------------------------+----------+---------------------------+
```

- **FR-01 (Graph Construction):** The system shall instantiate roadway networks as directed multigraphs $G=(V, E)$, supporting arbitrary node intersections and directed roadway segments.
- **FR-02 (Road Attributes):** Each roadway edge shall store physical length, number of lanes ($\ge 1$), maximum speed limit ($v_{max}$), capacity ($C$), and operational status (`OPEN`, `CLOSED`, `ACCIDENT`, `CONSTRUCTION`).
- **FR-03 (Simulation Loop):** The core engine shall execute a discrete-time clock advancing at fixed intervals of $\Delta t = 0.1\text{ s}$ ($10\text{ Hz}$), processing updates in a deterministic ten-step sequence.
- **FR-04 (IDM Acceleration):** The system shall compute continuous vehicle acceleration and deceleration governed by the Intelligent Driver Model using distinct physical profiles for Cars, Trucks, Buses, and Emergency vehicles.
- **FR-05 (MOBIL Lane Selection):** The system shall evaluate lateral lane transitions using the MOBIL incentive and safety criteria, preventing transitions that violate follower safety limits ($b_{safe}$).
- **FR-06 (Pedestrian Dynamics):** The simulation shall model pedestrian agents crossing designated roadways using the Social Force Model with target attraction and collision avoidance.
- **FR-07 (Gap Acceptance):** The vehicle manager shall enforce minimum critical time headways and lag distances before allowing vehicles to merge or execute turns at unsignalized intersections.
- **FR-08 (Signalized Traffic Control):** The system shall support fixed-time and actuated traffic signal controllers cycling through Green, Yellow, and Red phases with configurable offsets.
- **FR-09 (Dijkstra Shortest Path):** The routing module shall implement Dijkstra's algorithm to compute shortest paths based on instantaneous dynamic roadway travel times.
- **FR-10 (Admissible A* Pathfinding):** The routing module shall implement $A^*$ search using Euclidean spatial distance divided by maximum network speed as an admissible, monotonic heuristic.
- **FR-11 (Dynamic Hierarchical Routing):** The system shall support hierarchical network partitioning (`dynamic_hld`) that biases long-distance transit toward arterial expressways.
- **FR-12 (Congestion Calculation):** The engine shall dynamically compute roadway congestion ratios ($\rho = N_{vehicles} / C_{capacity}$) and adjust edge travel times using the BPR formula.
- **FR-13 (Incident Injection):** Users shall be able to spawn road accidents, construction blockages, and debris hazards during active simulations, reducing lane capacity or closing segments.
- **FR-14 (Emergency Vehicle Preemption):** Emergency vehicles shall possess elevated IDM speed profiles, aggressive lane-clearing behaviors, and priority routing.
- **FR-15 (Scenario Selection):** The platform shall provide at least five built-in scenarios (Normal, Rush Hour, Accident, Closure, Emergency) loaded from validated JSON definitions.
- **FR-16 (Headless Benchmarking):** The system shall support headless execution to run identical scenarios across competing routing algorithms, recording statistical metrics without rendering overhead.
- **FR-17 (3D WebGL Visualization):** The platform shall render roadway geometry, lane dividers, vehicles with orientation vectors, and signal lamps in Three.js at $\ge 30\text{ FPS}$.
- **FR-18 (Telemetry Dashboard):** The UI shall display live telemetry including active vehicle count, completed trips, average speed, congestion indices, and algorithm runtimes.
- **FR-19 (Local-First Storage):** The system shall persist custom road networks, scenario configurations, and benchmark historical logs in IndexedDB using Dexie.js.
- **FR-20 (Schema Validation):** All imported and persisted scenarios shall undergo strict runtime schema validation via Zod before engine ingestion.

### 4.3 Non-Functional Requirements (NFR-01 to NFR-15)

- **NFR-01 (Deterministic Repeatability):** Running the same scenario with the same random seed must yield identical numerical results across 100% of trials.
- **NFR-02 (Simulation Performance):** The simulation core must maintain a tick update time of $\le 15\text{ ms}$ for 250 active vehicles on modern browser hardware.
- **NFR-03 (Rendering Framerate):** The Three.js renderer must sustain $\ge 30\text{ FPS}$ (target $60\text{ FPS}$) during normal camera pans and zooms.
- **NFR-04 (Algorithm Execution Latency):** Single-pair shortest path calculations on a 100-node network must complete in $\le 5\text{ ms}$ for Dijkstra and $\le 2\text{ ms}$ for $A^*$.
- **NFR-05 (Zero-Backend Autonomy):** The application must function 100% offline without communicating with external web services or remote databases.
- **NFR-06 (Memory Footprint):** Client memory utilization must remain under $250\text{ MB}$ during sustained 30-minute simulation runs, with zero memory leaks from uncollected geometries.
- **NFR-07 (Code Quality & Modularity):** Core simulation logic must contain zero dependencies on React or DOM APIs, ensuring pure headless execution.
- **NFR-08 (Test Coverage):** Unit and integration test suites must maintain $\ge 85\%$ statement and branch coverage across core mathematical and algorithmic modules.
- **NFR-09 (Cross-Browser Compatibility):** The web application must run flawlessly on Chromium-based browsers (Chrome, Edge, Brave) and Firefox.
- **NFR-10 (Data Integrity):** IndexedDB database schemas must strictly adhere to Boyce-Codd Normal Form (BCNF) with enforced foreign key relations.
- **NFR-11 (Input Sanitization):** User scenario uploads must be validated against malformed or malicious payloads using strict Zod parsers.
- **NFR-12 (Responsive Interface):** The control panels, metrics drawers, and modal dialogs must adapt smoothly to viewport resolutions from $1280 \times 720$ to $3840 \times 2160$.
- **NFR-13 (Observability):** The system must log granular diagnostic warnings when vehicles experience unresolvable gridlock or routing dead-ends.
- **NFR-14 (Accessibility):** The UI must support high-contrast visual modes and keyboard shortcuts for simulation pause, play, step, and reset controls.
- **NFR-15 (Graceful Degradation):** On devices lacking hardware WebGL acceleration, the application must throttle particle effects while maintaining full simulation physics.

### 4.4 User, Data & Environment Interfaces
- **User Interface:** Built with React 18, Tailwind CSS, and shadcn/ui. Provides a viewport canvas, floating control dock (play/pause/step/speed multiplier), scenario selector, inspection drawer for selected vehicles/roads, and metrics analytics panel.
- **Data Persistence Interface:** Dexie.js wrapping browser IndexedDB with typed object stores for `simulations`, `networks`, `scenarios`, and `benchmarks`.
- **Software/Hardware Environment:** Standards-compliant HTML5/WebGL2 browser runtime; Node.js 20+ development toolchain; Vite 5 bundling pipeline.

---

## 5. Methodology, Architecture & Technical Approach

### 5.1 Decoupled Layered System Topology
RouteX is engineered following a clean, five-layer decoupled architecture that strictly enforces separation of concerns. The layers communicate via strictly defined interfaces, ensuring that simulation math, application state, and graphical rendering remain completely decoupled.

```
+-----------------------------------------------------------------------------------+
|                        FIVE-TIER SYSTEM TOPOLOGY                                  |
+-----------------------------------------------------------------------------------+
| 1. UI Presentation Layer       | React 18, Tailwind CSS, shadcn/ui, Recharts.     |
| 2. State Management Layer      | Zustand Store (Synchronized Snapshots).          |
| 3. Simulation Core Engine      | Discrete-Time Clock, Event Queue, Math Models.   |
| 4. Algorithmic Routing Engine  | Dijkstra, Admissible A*, Dynamic HLD Pathfinding. |
| 5. Hardware Rendering & Storage| Three.js WebGL Engine & Dexie.js / IndexedDB.    |
+-----------------------------------------------------------------------------------+
```

1. **Layer 1: Presentation & Controls (React 18):** Houses interactive controls, analytics charts, parameter sliders, and incident triggers. The UI does not execute simulation physics or mutate vehicles directly; it issues declarative actions to the store.
2. **Layer 2: Application State Orchestration (Zustand):** Serves as the reactive bridge. Holds UI preferences, active scenario metadata, playback speed ($1\times, 2\times, 5\times$), selected entities, and the latest simulation snapshot.
3. **Layer 3: Core Simulation Engine (`src/core/`):** Pure TypeScript mathematical engine. Independent of React, browser DOM, or graphics libraries. Operates on discrete time steps ($\Delta t$).
4. **Layer 4: Routing & Optimization (`src/core/routing/`):** Algorithmic solvers operating on graph data structures. Fully isolated for independent automated testing and comparative benchmarking.
5. **Layer 5: Visualization & Persistence (`src/rendering/` & `src/db/`):** Three.js consumes read-only simulation state snapshots to position meshes on the GPU canvas. Dexie.js commits completed runs, networks, and telemetry into IndexedDB.

### 5.2 Microscopic Discrete-Time Simulation Loop
The simulation engine executes a deterministic, discrete-time update loop. Each clock tick represents exactly $\Delta t = 0.1\text{ seconds}$ of real-world physical time. The tick progression follows an unyielding ten-stage pipeline:

```
[ Tick Start: t = t + Δt ]
           │
           ▼
[ Stage 1: Advance Simulation Clock & Process Scheduled Scenario Events ]
           │
           ▼
[ Stage 2: Update Traffic Signal Controllers (Cycle Timing & Phase Transitions) ]
           │
           ▼
[ Stage 3: Spawn New Vehicles from Origin Demand Generators (Poisson/Deterministic) ]
           │
           ▼
[ Stage 4: Compute Pedestrian Crowds & Crosswalk Occupancy (Social Force Model) ]
           │
           ▼
[ Stage 5: Evaluate Intersection Yielding & Merging (Gap Acceptance Model) ]
           │
           ▼
[ Stage 6: Calculate Lateral Lane Transitions for All Vehicles (MOBIL Criterion) ]
           │
           ▼
[ Stage 7: Calculate Longitudinal Accelerations & Update Positions (IDM Integration) ]
           │
           ▼
[ Stage 8: Update Roadway Occupancy, Density & Dynamic Impedance Values ]
           │
           ▼
[ Stage 9: Evaluate Dynamic Rerouting Triggers (Incidents, Severe Congestion) ]
           │
           ▼
[ Stage 10: Harvest Telemetry Metrics & Emit Read-Only Snapshot to Zustand/Renderer ]
           │
           ▼
[ Tick Complete ]
```

### 5.3 Low-Level Subsystem Breakdown
- **Network Subsystem (`src/core/network/`):** Implements `RoadNetwork`, `Graph`, `Node`, and `Edge` data structures. Supports dynamic edge weight calculation, traversability checks, capacity thresholds, and network topology cloning.
- **Vehicle Subsystem (`src/core/simulation3d/`):** Encapsulates `Vehicle`, tracking position along continuous spline coordinates ($s$), lateral lane index, speed, target speed, acceleration, and trip history.
- **Traffic Physics Subsystem (`src/core/simulation3d/`):** Contains pure mathematical implementations of `IDM.ts`, `MOBIL.ts`, `SocialForce.ts`, and `GapAcceptance.ts`.
- **Routing Subsystem (`src/core/routing/`):** Contains the common `RoutingAlgorithm` interface, implementing `createDijkstra()`, `createAStar()`, and `createHierarchicalRouting()`.
- **Incident Subsystem (`src/components/modals/IncidentsModal.tsx`):** Manages dynamic perturbations: accidents, lane closures, construction zones, and debris blockages with stochastic clearance times.
- **Analytics Subsystem (`src/core/analytics/`):** Aggregates statistical metrics: average travel times, vehicle throughput (vehicles/hour), global network congestion index, and algorithmic computation latency.

### 5.4 Graph-Based Road Network Modeling & Topological Data Flow
The physical roadway infrastructure is modeled mathematically as an attributed directed multigraph:

$$\mathcal{G} = (\mathcal{V}, \mathcal{E})$$

Where:
- $\mathcal{V}$ is the set of vertices representing intersections, road entry points (sources), exit terminals (sinks), and pedestrian crosswalk nodes. Each vertex $u \in \mathcal{V}$ has spatial coordinates $(x_u, y_u)$ and optional signal controller attachments.
- $\mathcal{E}$ is the set of directed edges representing distinct directional travel corridors. An edge $e = (u, v) \in \mathcal{E}$ is defined by:
  $$e = \langle \text{id}, u, v, L_e, v_{\max, e}, C_e, n_{\text{lanes}}, \text{status}, \text{priority} \rangle$$
  where $L_e$ is length in meters, $v_{\max, e}$ is the regulatory speed limit, $C_e$ is hourly vehicle capacity, and $n_{\text{lanes}}$ is the lane count.

Edge traversal impedance $w(e, t)$ is not static; it is updated dynamically every simulation cycle based on the current vehicle count $N_e(t)$ and incident restrictions:

$$w(e, t) = \begin{cases} \infty, & \text{if } \text{status}(e) \in \{\text{CLOSED}, \text{BLOCKED}\} \\ \frac{L_e}{v_{\text{eff}}(e, t)} + \delta_{\text{signal}}(e, t), & \text{otherwise} \end{cases}$$

### 5.5 High-Frequency Three.js Rendering & Scene Graph Decoupling
To ensure that rendering operations never block mathematical simulation steps, the Three.js rendering layer operates via `requestAnimationFrame` decoupled from the engine:
1. **Double-Buffered State Consumption:** The renderer reads immutable snapshots published by the engine. It never holds references to mutable internal engine structures.
2. **Instanced Mesh Optimization:** Vehicle geometries (cars, trucks, buses) are rendered using optimized meshes with dynamic position and rotation matrix updates, preventing garbage collection spikes.
3. **Dynamic Camera Controllers:** The renderer supports OrbitControls for aerial network overview, a top-down orthogonal tracking mode, and an "Action Cam" following selected vehicles.

---

## 6. Technical Rigor: Advanced CSE/SE Concept Synthesis

As mandated by **Section 4 (Technical Rigor: Advanced Concept Synthesis)** of the Capstone Project Guide, capstone projects must incorporate and articulate concepts from **at least three (3) technical domains**. RouteX synthesizes advanced concepts across **seven (7) distinct domains**:

```
+-----------------------------------------------------------------------------------+
|             CURRICULUM SYNTHESIS: SEVEN ADVANCED TECHNICAL DOMAINS                |
+-----------------------------------------------------------------------------------+
| 1. Data Structures & Graph Algorithms  | Directed Multigraphs, A*, Dijkstra, O(n) |
| 2. Simulation & Modeling (Physics)    | IDM, MOBIL, Social Force, Discrete-Time   |
| 3. Architecture & Database Theory      | Layered Decoupling, BCNF, IndexedDB ACID  |
| 4. Operating Systems & Concurrency     | Web Worker Multi-Threading, Shared Memory |
| 5. Software QA & Test Automation       | TDD, Vitest Unit/Integration, Playwright  |
| 6. Cybersecurity & Threat Modeling     | STRIDE Model, Zod Runtime Sanitization    |
| 7. Ethics, Responsibility & Equity     | Ethical Impact Analysis (EIA), Green ITS  |
+-----------------------------------------------------------------------------------+
```

### 6.1 Domain 1: Data Structures, Advanced Graph Theory & Computational Complexity
- **Synthesis:** The road network is modeled as an adjacency-list directed multigraph with spatial coordinate mapping. Pathfinding implements:
  - **Dijkstra's Algorithm:** Optimal non-heuristic path search using priority queues with dynamic impedance edge costs.
  - **$A^*$ Search Algorithm:** Heuristic-driven search utilizing Euclidean spatial distance divided by maximum network speed as an admissible, monotonic lower bound:
    $$h(n) = \frac{\|\mathbf{p}_n - \mathbf{p}_{\text{dest}}\|_2}{v_{\max}}$$
    Because $v_{\max} \ge v(e)$ for all edges, $h(n)$ never overestimates the true travel time to the destination ($h(n) \le h^*(n)$), guaranteeing optimal path discovery while pruning the visited state space by up to $65\%$ compared to Dijkstra.
  - **Computational Complexity Analysis:**
    - Dijkstra / $A^*$ Graph Search: $\mathcal{O}((|E| + |V|) \log |V|)$ using binary min-heaps.
    - IDM Vehicle State Updates: $\mathcal{O}(N)$ where $N$ is active vehicles, maintaining sorted leader-follower lane arrays in $\mathcal{O}(N \log N)$ per lane.
    - Social Force Pedestrian Interactions: $\mathcal{O}(M^2)$ naive or $\mathcal{O}(M)$ with spatial grid bucketing, where $M$ is pedestrian count.

### 6.2 Domain 2: Continuous & Discrete Simulation Physics (IDM, MOBIL, Social Force)
- **Synthesis:** Rather than abstracting vehicle movements as discrete cell transitions (cellular automata), RouteX implements continuous differential equations solved numerically via discrete-time Euler integration:
  - **Intelligent Driver Model (IDM):** Models non-linear acceleration and deceleration to maintain safe headway distances, accurately reproducing traffic shockwaves and phantom traffic jams.
  - **MOBIL Model:** Calculates lane change utility by comparing acceleration advantage against follower braking penalties, parameterized by driver politeness factor $p$.
  - **Social Force Model:** Simulates pedestrian crosswalk behaviors using continuous vector fields of destination attraction and exponential psychological repulsion forces.

### 6.3 Domain 3: Systems Architecture & Database Theory (BCNF / IndexedDB ACID Transactions)
- **Synthesis:** The client-side database layer is designed strictly in compliance with relational database theory:
  - **Boyce-Codd Normal Form (BCNF):** The Dexie.js relational schema decouples `simulations`, `networks`, `scenarios`, and `benchmarks`. All functional dependencies $X \to Y$ have $X$ as a superkey, eliminating insertion, update, and deletion anomalies.
  - **Client-Side ACID Transactions:** Dexie.js transactions ensure atomic commits when logging benchmark runs; partial failures roll back cleanly, preserving local database consistency.

### 6.4 Domain 4: Operating Systems, Concurrency & Multithreaded Web Workers
- **Synthesis:** Browser JavaScript runs on a single event-driven UI thread. Under heavy traffic loads (500+ vehicles with continuous path recalculation), physics computation can induce UI frame drops (jank).
  - **Worker Multithreading:** RouteX isolates simulation computation within dedicated HTML5 Web Workers (`src/workers/simulation.worker.ts`).
  - **Asynchronous Message Passing:** The worker executes the discrete simulation clock and marshals immutable, structured clone state snapshots across an asynchronous message channel to the main thread at $60\text{ Hz}$, ensuring zero UI thread interruption.

### 6.5 Domain 5: Software Quality Assurance, TDD & Verification Metrics
- **Synthesis:** The development workflow adheres to Test-Driven Development (TDD):
  - **Unit Testing (Vitest):** Formal test suites covering graph builders, Dijkstra path validity, $A^*$ admissibility, IDM deceleration correctness, and MOBIL lane safety.
  - **End-to-End Verification (Playwright):** Automated headless browser tests simulating user interaction: loading scenarios, triggering accidents, toggling routing algorithms, and verifying telemetry rendering.
  - **Coverage Metrics:** Strict enforcement of $\ge 85\%$ statement, branch, and function coverage across all core simulation and routing modules.

### 6.6 Domain 6: Cybersecurity Engineering & Formal Threat Modeling (STRIDE Analysis)
- **Synthesis:** A formal STRIDE threat analysis protects local data integrity and execution safety:
  - **Spoofing & Tampering:** Malformed scenario files injected by users are sanitized at runtime via strict Zod schemas (`ScenarioConfigSchema`), blocking prototype pollution and malicious data structures.
  - **Information Disclosure:** Complete local-first design guarantees that sensitive user network maps and simulation runs are never transmitted to external cloud servers.
  - **Denial of Service (Client DoS):** Ingestion limits enforce bounds on node counts ($\le 1,000$), edges ($\le 2,500$), and vehicle spawn rates ($\le 50\text{ veh/s}$) to prevent memory exhaustion and browser tab termination.

### 6.7 Domain 7: Professional Ethics, Social Responsibility & Ethical Impact Analysis (EIA)
- **Synthesis:** Algorithmic routing choices carry profound societal consequences:
  - **Emergency Preemption Equity:** The system prioritizes emergency medical vehicles to minimize mortality risks, while modeling the secondary congestion penalties imposed on civilian transit corridors.
  - **Environmental & Carbon Optimization:** RouteX models vehicle fuel consumption and carbon emission proxies based on acceleration and idling cycles, demonstrating how dynamic route optimization reduces urban carbon footprints.
  - **Pedestrian Safety Equity:** Modeling pedestrian crosswalk delays prevents optimization algorithms from treating vulnerable road users as negligible impedance factors.
  - **Academic Integrity:** Zero fabrication of benchmark data; all charts, travel times, and performance metrics reflect real mathematical executions.

---

## 7. Mathematical Formulations & Algorithmic Specifications

### 7.1 Mathematical Formulation: Intelligent Driver Model (IDM)
The Intelligent Driver Model (Treiber, Hennecke & Helbing, 2000) governs the longitudinal acceleration $\frac{dv}{dt}$ of each vehicle as a function of its current velocity $v$, the net distance headway $s$ to the leading vehicle, and the velocity difference $\Delta v = v - v_{lead}$:

$$\frac{dv}{dt} = a \left[ 1 - \left( \frac{v}{v_0} \right)^\delta - \left( \frac{s^*(v, \Delta v)}{s} \right)^2 \right]$$

Where the dynamic desired minimum bumper-to-bumper gap $s^*(v, \Delta v)$ is defined as:

$$s^*(v, \Delta v) = s_0 + \max \left( 0, \; v T + \frac{v \cdot \Delta v}{2 \sqrt{a \cdot b}} \right)$$

**Model Parameters & Values:**
- $v_0$: Desired free-flow speed ($13.9\text{ m/s} \approx 50\text{ km/h}$ for cars; $20.0\text{ m/s}$ for emergency).
- $s_0$: Jam distance / minimum static distance at standstill ($2.0\text{ m}$).
- $T$: Safe time headway ($1.5\text{ s}$).
- $a$: Maximum vehicle acceleration ($1.4\text{ m/s}^2$).
- $b$: Comfortable deceleration rate ($2.0\text{ m/s}^2$).
- $\delta$: Free acceleration exponent (standardized to $4$).

```
+-----------------------------------------------------------------------------------+
|                        IDM PARAMETER PROFILE MATRIX                               |
+-------------------+-------------+-------------+--------------+--------------------+
| Vehicle Class     | Desired v0  | Max Accel a | Decel b      | Min Gap s0         |
+-------------------+-------------+-------------+--------------+--------------------+
| Passenger Car     | 13.9 m/s    | 1.4 m/s²    | 2.0 m/s²     | 2.0 m              |
| Heavy Truck       | 11.1 m/s    | 0.7 m/s²    | 1.5 m/s²     | 3.0 m              |
| Transit Bus       | 11.1 m/s    | 0.8 m/s²    | 1.8 m/s²     | 3.0 m              |
| Emergency Vehicle | 20.0 m/s    | 2.8 m/s²    | 3.5 m/s²     | 1.5 m              |
+-------------------+-------------+-------------+--------------+--------------------+
```

### 7.2 Mathematical Formulation: MOBIL Autonomous Lane-Changing Criterion
The MOBIL (Minimizing Overall Braking Induced by Lane changes) model (Kesting, Treiber & Helbing, 2007) governs lateral lane changes. A vehicle initiates a lane change if and only if both the **safety criterion** and the **incentive criterion** are satisfied.

**1. Safety Criterion (Follower Braking Constraint):**
The prospective new follower vehicle in the target lane ($\tilde{f}$) must not be subjected to dangerous deceleration exceeding the safe braking threshold $b_{safe}$:

$$\tilde{a}_{\tilde{f}} \ge -b_{safe}$$

where $\tilde{a}_{\tilde{f}}$ is the deceleration of the target follower if the lane change occurs. RouteX enforces $b_{safe} = 4.0\text{ m/s}^2$.

**2. Incentive Criterion (Politeness & Acceleration Advantage):**
The lane change must provide an acceleration gain for the vehicle ($c$), weighed against the deceleration penalties imposed on the old follower ($o$) and new follower ($\tilde{f}$):

$$\underbrace{(\tilde{a}_c - a_c)}_{\text{Subject Advantage}} + p \left[ \underbrace{(\tilde{a}_{\tilde{f}} - a_{\tilde{f}})}_{\text{Target Follower Penalty}} + \underbrace{(\tilde{a}_o - a_o)}_{\text{Old Follower Advantage}} \right] > \Delta a_{th}$$

Where:
- $p$: Politeness factor ($p = 0.2$ in RouteX, representing moderate altruism).
- $\Delta a_{th}$: Acceleration switching threshold ($0.2\text{ m/s}^2$), preventing erratic high-frequency lane oscillation.

### 7.3 Mathematical Formulation: Social Force Model for Pedestrian Crowd Dynamics
Pedestrian movement across signalized crosswalks and intersections is modeled using the Social Force Model (Helbing & Molnar, 1995). The net force $\mathbf{F}_i$ acting on pedestrian $i$ combines destination attraction, interpersonal repulsion, and vehicular avoidance:

$$\mathbf{F}_i = \mathbf{f}_i^{\text{dest}} + \sum_{j \ne i} \mathbf{f}_{ij}^{\text{ped}} + \sum_{k} \mathbf{f}_{ik}^{\text{veh}}$$

1. **Destination Driving Force:**
   $$\mathbf{f}_i^{\text{dest}} = \frac{v_{0, i} \mathbf{e}_{0, i} - \mathbf{v}_i}{\tau}$$
   where $\mathbf{e}_{0, i}$ is the unit vector toward the destination waypoint, $v_{0, i}$ is desired walking speed ($1.3\text{ m/s}$), and $\tau = 0.5\text{ s}$ is relaxation time.

2. **Interpersonal Repulsion Force:**
   $$\mathbf{f}_{ij}^{\text{ped}} = A_{ped} \exp \left( \frac{r_{ij} - d_{ij}}{B_{ped}} \right) \mathbf{n}_{ij}$$
   where $d_{ij}$ is center-to-center distance, $r_{ij} = r_i + r_j$ is combined pedestrian radii ($0.4\text{ m}$), $A_{ped} = 2.0\text{ N}$, and $B_{ped} = 0.3\text{ m}$.

3. **Vehicular Repulsion Force:**
   $$\mathbf{f}_{ik}^{\text{veh}} = A_{veh} \exp \left( \frac{r_{ik} - d_{ik}}{B_{veh}} \right) \mathbf{n}_{ik}$$
   ensuring pedestrians yield and retreat from the path of oncoming vehicles.

### 7.4 Algorithmic Specification: Admissible Heuristic A* Shortest Path Search

```
Algorithm 1: Admissible Heuristic A* Pathfinding with Dynamic Edge Costs
-------------------------------------------------------------------------
Input : RoadNetwork G = (V, E), Origin u, Destination v, CostFunction c
Output: Route R = (nodes, edges, totalCost, computationMs) or null

1:  start_time <- performance.now()
2:  if u not in V or v not in V then throw InvalidNodeException
3:  gScore <- Map(u -> 0)
4:  fScore <- Map(u -> heuristic(u, v, G))
5:  prev <- Map()
6:  openSet <- MinPriorityQueue ordered by fScore
7:  closedSet <- Set()
8:  openSet.insert(u, fScore[u])
9:  
10: while openSet is not empty do
11:     current <- openSet.extractMin()
12:     if current == v then
13:         return reconstructRoute(prev, current, gScore[v], start_time)
14:     end if
15:     closedSet.add(current)
16:     
17:     for each (neighbor, edgeId) in G.neighbors(current) do
18:         if neighbor in closedSet then continue
19:         edge <- G.getRoad(edgeId)
20:         cost_e <- c(edge)
21:         if cost_e == Infinity then continue
22:         
23:         tentative_g <- gScore[current] + cost_e
24:         if tentative_g < (gScore[neighbor] ?? Infinity) then
25:             prev[neighbor] <- { node: current, edge: edgeId }
26:             gScore[neighbor] <- tentative_g
27:             fScore[neighbor] <- tentative_g + heuristic(neighbor, v, G)
28:             openSet.insertOrUpdate(neighbor, fScore[neighbor])
29:         end if
30:     end for
31: end while
32: return null (No reachable route exists)
```

**Theorem (Admissibility & Monotonicity of Euclidean Heuristic):**
Let $h(n) = \frac{\|\mathbf{p}_n - \mathbf{p}_{\text{dest}}\|_2}{v_{\max}}$ where $v_{\max} = \max_{e \in \mathcal{E}} v_{\max, e}$. Since the shortest possible physical travel path between $n$ and $\text{dest}$ is the straight Euclidean line segment $\|\mathbf{p}_n - \mathbf{p}_{\text{dest}}\|_2$, and the maximum physical speed achievable anywhere in the network is $v_{\max}$, the minimum possible travel time cannot be less than $h(n)$. Hence:

$$h(n) \le h^*(n), \quad \forall n \in \mathcal{V}$$

Furthermore, by the triangle inequality of Euclidean space, for any edge $e = (n, m)$ with traversal cost $c(e) \ge \frac{\|\mathbf{p}_n - \mathbf{p}_m\|_2}{v_{\max}}$:

$$h(n) \le c(n, m) + h(m)$$

Thus, the heuristic is monotonic (consistent), guaranteeing that the first time node $v$ is expanded from `openSet`, its computed path is strictly optimal. No closed node requires re-opening.

### 7.5 Algorithmic Specification: Dynamic Hierarchical Multi-Level Routing (`dynamic_hld`)
Dynamic Hierarchical Routing partitions the roadway network into hierarchical tiers:
1. **Tier 1 (Arterial / Expressways):** High speed limit ($v \ge 18\text{ m/s}$), multi-lane ($n \ge 2$), priority factor $\pi = 0.75$.
2. **Tier 2 (Collector / Local Streets):** Standard residential and local connectors ($\pi = 1.0$).

The hierarchical cost function evaluates:

$$c_{\text{hierarchical}}(e) = c_{\text{dynamic}}(e) \cdot \pi(e)$$

This preferential impedance bonus funnels long-distance vehicular trips onto high-capacity arterials, drastically reducing search state space and simulating human driver route choice preferences.

### 7.6 Mathematical Formulation: Bureau of Public Roads (BPR) Congestion Cost Function
Dynamic edge travel time $t_e$ is updated as a function of the volume-to-capacity ratio using the classical Federal Highway Administration / Bureau of Public Roads (BPR) formulation:

$$t_e(V_e) = t_{0, e} \left[ 1 + \alpha \left( \frac{V_e}{C_e} \right)^\beta \right]$$

Where:
- $t_{0, e} = \frac{L_e}{v_{\max, e}}$: Free-flow travel time.
- $V_e$: Instantaneous vehicle count traversing road edge $e$.
- $C_e$: Nominal physical design capacity of edge $e$.
- $\alpha = 0.15, \; \beta = 4.0$: Standard empirical calibration coefficients.

As volume exceeds capacity ($V_e / C_e > 1.0$), travel impedance escalates quarticly ($\beta = 4$), triggering dynamic rerouting algorithms to divert subsequent vehicles to alternative corridors.

---

## 8. Team Organization, Professional Roles, WBS & Schedule

### 8.1 Professional Engineering Team Structure
To fulfill the requirements of **Section 2.1 (Team Formation & Mandatory Professional Roles)** of the Capstone Project Guide, the eight-member student engineering team is formally structured with clear boundaries of technical ownership:

```
+-----------------------------------------------------------------------------------+
|                        ENGINEERING TEAM HIERARCHY                                 |
+-----------------------------------------------------------------------------------+
|                           Project Coordinator & PM                                |
|                        (Agile Tracking & Faculty Liaison)                         |
|                                       │                                           |
|         ┌─────────────────────────────┼─────────────────────────────┐             |
|         ▼                             ▼                             ▼             |
|  Lead Systems Architect       Lead Algorithms Engineer      QA Automation Lead    |
|   (Simulation Core & Loop)      (Graph Search, Dijkstra, A*)  (TDD, Vitest, Tests)|
|         │                             │                             │             |
|         ▼                             ▼                             ▼             |
|  Traffic Physics Specialist   3D Graphics Architect         Data & Concurrency    |
|   (IDM, MOBIL, Social Force)    (Three.js WebGL Engine)       (Dexie, BCNF, Worker) |
|                                       │                                           |
|                                       ▼                                           |
|                         Frontend Architect & Docs                                 |
|                        (React, UI Shell, SRS Report)                              |
+-----------------------------------------------------------------------------------+
```

1. **Student 1 (Project Coordinator / Scrum Master):** Maintains Jira/GitHub project boards, conducts weekly sprint planning and standups, serves as sole formal liaison to the Faculty Supervisor.
2. **Student 2 (Lead Systems Architect & Core Developer):** Designs discrete simulation engine loop, clock synchronization, snapshot pipeline, and event scheduler.
3. **Student 3 (Lead Algorithms & Optimization Engineer):** Develops graph structures, Dijkstra, $A^*$ search with admissible heuristic, and hierarchical routing algorithms.
4. **Student 4 (Traffic Simulation & Physics Specialist):** Implements microscopic car-following (IDM), lane changing (MOBIL), pedestrian dynamics (Social Force), and gap acceptance.
5. **Student 5 (3D Graphics & Rendering Architect):** Develops Three.js WebGL scene graph, instanced mesh geometries, camera controls, and lighting.
6. **Student 6 (QA Lead & Test Automation Engineer):** Orchestrates Vitest unit testing, Playwright E2E browser automation, CI/CD pipeline, and coverage reporting ($\ge 85\%$).
7. **Student 7 (Data Persistence & Concurrency Engineer):** Implements Dexie.js IndexedDB schema, BCNF normalization, transactional integrity, and Web Worker thread offloading.
8. **Student 8 (Frontend Architect & Documentation Specialist):** Builds React 18 UI shell, Tailwind CSS styling, Recharts dashboards, and authors formal IEEE 830 / PAD documentation.

### 8.2 Work Breakdown Structure (WBS)
- **WBS 1.0 Project Management & Requirements:** Sprint backlog, PAD / SRS formulation, Faculty review checkpoints.
- **WBS 2.0 Graph Network & Data Structures:** Directed multigraph, edge builder, topological serialization, Zod validation.
- **WBS 3.0 Microscopic Physical Simulation Core:** IDM car-following, MOBIL lane switching, Social Force model, traffic signals.
- **WBS 4.0 Algorithmic Pathfinding Engine:** Dijkstra solver, admissible $A^*$ solver, Dynamic HLD solver, cost functions.
- **WBS 5.0 High-Performance 3D Visualization:** Three.js scene setup, road meshes, vehicle instancing, camera controls.
- **WBS 6.0 Persistence & Telemetry Store:** Dexie.js database, BCNF tables, historical benchmark logger, Recharts charts.
- **WBS 7.0 Verification & Benchmark Harness:** Vitest unit test suite, Playwright E2E tests, 5-scenario automated benchmark runner.

### 8.3 Capstone Milestone Roadmap & Delivery Timeline (Weeks 1 to 14)

```
+-----------------------------------------------------------------------------------+
|                        CAPSTONE 14-WEEK PROJECT TIMELINE                          |
+---------+------------------------------------------------+------------------------+
| Week    | Milestone / Engineering Activity               | Primary Deliverable    |
+---------+------------------------------------------------+------------------------+
| Week 01 | Project Inception & Team Role Assignment       | Team Charter           |
| Week 02 | Requirements Gathering & Architecture Design   | Group Registration     |
| Week 03 | Mathematical Formulation & Schema Definition   | Draft SRS              |
| Week 04 | Final PAD & Proposal Submission (Deliverable I)| PAD Formal Document    |
| Week 05 | Core Graph Engine & Network Builder Prototype  | Graph Subsystem        |
| Week 06 | IDM & MOBIL Microscopic Physics Implementation | Physics Engine         |
| Week 07 | Dijkstra & Admissible A* Pathfinding Engine    | Routing Algorithms     |
| Week 08 | Mid-Project Evaluation & Architectural Review  | Midterm Faculty Defense|
| Week 09 | Three.js WebGL 3D Visualization Pipeline       | 3D Scene Integration   |
| Week 10 | Dexie.js IndexedDB BCNF Schema & Web Worker    | Persistence Layer      |
| Week 11 | Incident Dock & Scenario Benchmark Suite       | Scenario Engine        |
| Week 12 | End-to-End Vitest & Playwright Verification    | QA Coverage Report     |
| Week 13 | Final Code Hardening & Demonstration Video Run | Codebase Lockdown      |
| Week 14 | Final Submission: Source Code & Video Defense  | Deliverables II & III  |
+---------+------------------------------------------------+------------------------+
```

---

## 9. Comprehensive Technical Risk Analysis & Mitigation Engineering

### 9.1 Risk Identification, Likelihood & Impact Matrix

```
+-----------------------------------------------------------------------------------+
|                           RISK ASSESSMENT MATRIX                                  |
+----------------------+----------+--------+-------------+--------------------------+
| Risk Description     | Category | Likeli | Severity    | Risk Priority Level (RPN)|
+----------------------+----------+--------+-------------+--------------------------+
| R-01: Engine Frame   | Perf     | Medium | High        | HIGH                     |
| Rate Degradation     |          |        |             |                          |
| R-02: Pathfinding    | Algo     | High   | High        | CRITICAL                 |
| Combinatorial Blowup |          |        |             |                          |
| R-03: Deadlock in    | Physics  | Medium | High        | HIGH                     |
| Complex Intersections|          |        |             |                          |
| R-04: IndexedDB      | Data     | Low    | Medium      | LOW                      |
| Storage Quota Limits |          |        |             |                          |
| R-05: Team Git Commit| Process  | Medium | High        | HIGH                     |
| Imbalance (>80% rule)|          |        |             |                          |
+----------------------+----------+--------+-------------+--------------------------+
```

### 9.2 Failure Modes and Effects Analysis (FMEA)
1. **Failure Mode R-01 (Engine Frame Rate Degradation Under 300+ Vehicles):**
   - *Cause:* Running IDM continuous calculation, MOBIL checks, and Three.js mesh matrix transformations concurrently on the main JavaScript thread.
   - *Mitigation:* Decouple the simulation engine into a dedicated Web Worker (`simulation.worker.ts`). Enforce fixed discrete tick intervals ($10\text{ Hz}$) independent of screen refresh rates. Utilize Three.js InstancedMesh for zero per-vehicle draw call overhead.
2. **Failure Mode R-02 (Pathfinding Combinatorial Blowup During Gridlock):**
   - *Cause:* Hundreds of vehicles recalculating routes simultaneously when an arterial incident occurs.
   - *Mitigation:* Implement staggered route calculation with a maximum recalculation quota per tick ($\le 10\text{ vehicles/tick}$). Use the admissible Euclidean $A^*$ heuristic to prune unpromising branches, reducing search states by up to $65\%$.
3. **Failure Mode R-03 (Intersection Deadlock / Gridlock Freezes):**
   - *Cause:* Opposing vehicles blocking box intersections under dense traffic.
   - *Mitigation:* Implement strict Gap Acceptance checks and virtual stop line logic preventing vehicles from entering an intersection box unless the egress lane has sufficient clearance length.
4. **Failure Mode R-04 (IndexedDB Browser Quota Exhaustion):**
   - *Cause:* Persisting full tick-by-tick spatial coordinates of all vehicles during long simulations.
   - *Mitigation:* Store only aggregated time-series metrics (summary intervals every $1\text{ s}$) in IndexedDB. Persist full vehicle positions only in transient in-memory circular buffers.
5. **Failure Mode R-05 (Team Git Commit Imbalance - Capstone Rubric Violation):**
   - *Cause:* 1–2 developers writing the majority of commits, violating the Capstone Guide mandate requiring active, disciplined contributions from $\ge 80\%$ of team members.
   - *Mitigation:* Scrum Master enforces branch protection on `main` and `develop`. All features require dedicated feature branches (`feature/idm-physics`, `feature/astar-heuristic`, etc.) and peer code reviews before merging, ensuring balanced contribution across all 8 engineers.

### 9.3 Contingency & Disaster Recovery Procedures
- **Automated Continuous Integration (GitHub Actions):** Every commit and pull request triggers automated linting (`eslint`), type checking (`tsc --noEmit`), and test execution (`vitest run`). Commits that fail tests are blocked from merging.
- **Data Export & Import Safeguards:** In the event of browser local storage corruption, users can export and import complete scenario and benchmark databases via JSON files validated against Zod schemas.

---

## 10. System Verification, Validation & Empirical Performance Matrix

### 10.1 Automated Verification Harness Architecture
The verification harness implements automated testing across the entire system hierarchy:
1. **Mathematical & Physics Verification (Vitest):** Tests `IDM.ts`, verifying that vehicles decelerate smoothly to zero velocity when approaching a stationary vehicle and accelerate asymptotically to $v_0$ in free flow. Tests `MOBIL.ts` verifying that lane changes exceeding $-b_{safe}$ are rejected.
2. **Graph & Algorithmic Verification (Vitest):** Tests `algorithms.ts`, verifying that Dijkstra and $A^*$ return mathematically identical shortest path costs on static graphs, and that $A^*$ evaluates strictly fewer or equal node expansions than Dijkstra.
3. **End-to-End User Verification (Playwright):** Launches a headless Chromium browser instance, visits `http://localhost:5173`, loads the "Rush Hour" scenario, verifies that canvas renders successfully, injects an arterial incident, and verifies that telemetry cards update dynamically.

### 10.2 Empirical Benchmarks & Scenario Matrix
The system is evaluated across five standardized benchmark scenarios:

```
+-----------------------------------------------------------------------------------+
|                        BENCHMARK SCENARIO MATRIX                                  |
+-------------------+---------------+---------------+---------------+---------------+
| Scenario Name     | Vehicle Rate  | Road Network  | Perturbations | Test Duration |
+-------------------+---------------+---------------+---------------+---------------+
| 1. Normal Flow    | 1.5 veh/sec   | 16-Node Grid  | None          | 1,000 ticks   |
| 2. Rush Hour      | 4.5 veh/sec   | 16-Node Grid  | Demand Spikes | 1,500 ticks   |
| 3. Arterial Crash | 3.0 veh/sec   | Dual Arterial | Lane 1 Blocked| 1,200 ticks   |
| 4. Road Closure   | 2.5 veh/sec   | Ring Road     | Bridge Closed | 1,000 ticks   |
| 5. Emergency Run  | 3.5 veh/sec   | Hospital Corr | Ambulance Run | 800 ticks     |
+-------------------+---------------+---------------+---------------+---------------+
```

### 10.3 Requirements Traceability & Verification Matrix (RTM)

```
+-----------------------------------------------------------------------------------+
|                    REQUIREMENTS TRACEABILITY MATRIX (RTM)                         |
+-------------+----------------------+--------------------+-------------------------+
| Req ID      | Functional Area      | Implementing File  | Verification Test Suite |
+-------------+----------------------+--------------------+-------------------------+
| FR-01, 02   | Network Graph        | src/core/network/  | tests/unit/network.test |
| FR-03       | Discrete Engine Loop | src/core/sim3d/    | tests/unit/sim.test     |
| FR-04       | IDM Acceleration     | src/core/sim3d/IDM | tests/unit/physics.test |
| FR-05       | MOBIL Lane Change    | src/core/sim3d/MOBL| tests/unit/physics.test |
| FR-06       | Social Force Model   | src/core/sim3d/SF  | tests/unit/sf.test      |
| FR-07       | Gap Acceptance       | src/core/sim3d/Gap | tests/unit/gap.test     |
| FR-08       | Traffic Lights       | src/core/sim3d/TLC | tests/unit/traffic.test |
| FR-09       | Dijkstra Routing     | src/core/routing/  | tests/unit/routing.test |
| FR-10       | A* Search Heuristic  | src/core/routing/  | tests/unit/routing.test |
| FR-11       | Dynamic HLD Routing  | src/core/routing/  | tests/unit/routing.test |
| FR-12       | Dynamic Congestion   | src/core/traffic/  | tests/unit/traffic.test |
| FR-13, 14   | Incident & Emergency | src/components/    | tests/e2e/smoke.spec    |
| FR-15, 16   | Scenarios & Bench    | src/scenarios/     | tests/unit/sim.test     |
| FR-17       | Three.js Visualizer  | src/rendering/3d/  | tests/e2e/smoke.spec    |
| FR-18       | Telemetry Panels     | src/components/    | React Component Tests   |
| FR-19, 20   | Dexie DB & Zod Schem | src/db/, src/lib/  | tests/unit/schemas.test |
+-------------+----------------------+--------------------+-------------------------+
```

---

## 11. References & Appendices

### 11.1 Academic & Technical Literature References
1. **Treiber, M., Hennecke, A., & Helbing, D. (2000).** Congested traffic states in empirical observations and microscopic simulations. *Physical Review E*, 62(2), 1805–1824.
2. **Kesting, A., Treiber, M., & Helbing, D. (2007).** General lane-changing model MOBIL for car-following models. *Transportation Research Record*, 1999(1), 86–94.
3. **Helbing, D., & Molnar, P. (1995).** Social force model for pedestrian dynamics. *Physical Review E*, 51(5), 4282–4286.
4. **Dijkstra, E. W. (1959).** A note on two problems in connexion with graphs. *Numerische Mathematik*, 1(1), 269–271.
5. **Hart, P. E., Nilsson, N. J., & Raphael, B. (1968).** A formal basis for the heuristic determination of minimum cost paths. *IEEE Transactions on Systems Science and Cybernetics*, 4(2), 100–107.
6. **Bureau of Public Roads (1964).** *Traffic Assignment Manual.* U.S. Department of Commerce, Urban Planning Division, Washington D.C.
7. **IEEE Computer Society (1998).** *IEEE Recommended Practice for Software Requirements Specifications.* IEEE Std 830-1998.

### 11.2 Appendix A: Complete Dexie.js / IndexedDB Relational Schema DDL
```typescript
import Dexie, { Table } from 'dexie';
import { ScenarioConfig, SimulationSnapshot, ScenarioNetwork } from '../types';

export interface SavedSimulation {
  id?: number;
  name: string;
  scenarioId: string;
  createdAt: number;
  completedAt?: number;
  metrics: {
    totalVehicles: number;
    arrivedVehicles: number;
    averageSpeed: number;
    averageTravelTime: number;
    averageCongestion: number;
  };
  snapshots?: SimulationSnapshot[];
}

export interface SavedNetwork {
  id: string;
  name: string;
  description?: string;
  network: ScenarioNetwork;
  createdAt: number;
  updatedAt: number;
}

export interface BenchmarkRecord {
  id?: number;
  scenarioId: string;
  algorithm: string;
  averageTravelTime: number;
  averageCongestion: number;
  throughput: number;
  executionTimeMs: number;
  createdAt: number;
}

export class RouteXDatabase extends Dexie {
  simulations!: Table<SavedSimulation, number>;
  networks!: Table<SavedNetwork, string>;
  scenarios!: Table<ScenarioConfig, string>;
  benchmarks!: Table<BenchmarkRecord, number>;

  constructor() {
    super('RouteXDatabase');
    this.version(1).stores({
      simulations: '++id, scenarioId, name, createdAt',
      networks: 'id, name, createdAt',
      scenarios: 'id, name, type',
      benchmarks: '++id, scenarioId, algorithm, createdAt',
    });
  }
}

export const db = new RouteXDatabase();
```

### 11.3 Appendix B: Canonical Scenario Configuration Schema (Zod)
```typescript
import { z } from 'zod';
import { RoadStatus, RoadType, VehicleType, IncidentType, IncidentSeverity, NodeType, EventType } from '../types';

export const NodeSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  type: z.nativeEnum(NodeType),
  trafficLightId: z.string().nullable().optional(),
});

export const ScenarioRoadSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  destination: z.string().min(1),
  distance: z.number().positive(),
  speedLimit: z.number().positive(),
  capacity: z.number().positive(),
  lanes: z.number().int().positive(),
  roadType: z.nativeEnum(RoadType),
  status: z.nativeEnum(RoadStatus),
  priority: z.number(),
});

export const ScenarioNetworkSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(ScenarioRoadSchema),
});

export const ScenarioConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  duration: z.number().positive(),
  network: ScenarioNetworkSchema,
  trafficLights: z.array(z.any()),
  events: z.array(z.any()),
  incidents: z.array(z.any()),
  pedestrians: z.array(z.any()),
  vehicleSpawnRate: z.number().positive(),
  vehicleTypes: z.array(z.nativeEnum(VehicleType)),
});
```

---
*End of Problem Analysis Document (PAD) — RouteX Project*
