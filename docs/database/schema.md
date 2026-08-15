# Database schema

ORM models live in `apps/api/app/models/`; migrations are managed with Alembic
(`apps/api/app/migrations/`). Local development falls back to SQLite; production
uses PostgreSQL. The app also creates tables and seeds scenarios on startup
(lifespan), so the first run works even before migrating.

## Tables

### projects

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID pk | |
| name | str | |
| description | str? | |
| created_at / updated_at | datetime | |

### scenarios

| Column | Type | Notes |
| --- | --- | --- |
| id | str pk | stable slug (e.g. `normal`) |
| name | str | |
| description | str | |
| config_json | JSON | full `ScenarioConfig` |

Scenario data is version-controlled in `scenarios/*.json` and seeded on startup.

### simulations

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID pk | |
| scenario_id | FK → scenarios.id | |
| status | str | pending/running/paused/completed/stopped |
| config_json | JSON | runtime config (speed, seed, …) |
| seed | int | for reproducibility |
| started_at / ended_at | datetime? | |
| created_at | datetime | |

### simulation_metrics

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID pk | |
| simulation_id | FK → simulations.id | |
| tick | int | |
| time | float | seconds |
| avg_travel_time / max_congestion / avg_speed / … | float | per-tick metrics |

The in-memory `MetricsTracker` keeps a bounded history for live charts; rows are
persisted on completion.

### benchmarks

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID pk | |
| scenario_id | str | |
| algorithm | str | |
| metrics_json | JSON | computed results |
| created_at | datetime | |

## Migration workflow

```bash
cd apps/api
uv run --project . alembic revision --autogenerate -m "describe change"
uv run --project . alembic upgrade head
```

The initial migration is `a00f9cb3f39c_initial_schema.py`.
