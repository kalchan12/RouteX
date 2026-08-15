# API reference

Base URL: `http://localhost:8000` (see `.env.example`).

## Health & meta

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service liveness |
| GET | `/algorithms` | Registered routing algorithms |
| GET | `/scenarios` | Available scenarios |

## Projects

| Method | Path | Description |
| --- | --- | --- |
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/{id}` | Get project |
| PATCH | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project |

## Scenarios

| Method | Path | Description |
| --- | --- | --- |
| GET | `/scenarios` | List scenarios |
| POST | `/scenarios` | Upload/custom scenario |
| GET | `/scenarios/{id}` | Scenario detail + resolved config |

## Simulations

| Method | Path | Description |
| --- | --- | --- |
| POST | `/simulations` | Create simulation runtime + DB row |
| GET | `/simulations` | List simulations |
| GET | `/simulations/{id}` | Simulation detail |
| POST | `/simulations/{id}/start` | Start (async task) |
| POST | `/simulations/{id}/pause` | Pause |
| POST | `/simulations/{id}/resume` | Resume |
| POST | `/simulations/{id}/stop` | Stop and persist results |
| GET | `/simulations/{id}/snapshot` | Latest snapshot |
| GET | `/simulations/{id}/metrics` | Summary + metric time series |
| DELETE | `/simulations/{id}` | Delete |
| WS | `/ws/simulations/{id}` | Live snapshots + control acks |

### WebSocket protocol

On connect the server sends the current snapshot immediately, then pushes a
snapshot roughly every 100 ms while running. The client can send JSON control
messages: `{"type": "start"|"pause"|"resume"|"stop"|"set_speed", "speed": N}`.

## Benchmarks

| Method | Path | Description |
| --- | --- | --- |
| POST | `/benchmarks` | Run headless benchmark (scenario + algorithms + runs) |
| GET | `/benchmarks` | List past benchmarks |

Benchmark runs are synchronous and CPU-bound (fast at 600 ticks).

## Analytics

| Method | Path | Description |
| --- | --- | --- |
| GET | `/analytics/summary` | Aggregate metrics overview |

## Errors

Errors follow a consistent JSON shape with `detail`. 404 for unknown ids, 409
for invalid state transitions, 422 for validation failures.
