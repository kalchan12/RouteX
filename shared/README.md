# shared

Cross-package artifacts for RouteX.

- `schemas/` — shared data schemas (future: validated payloads used by the
  engine, API and frontend).
- `constants/` — cross-package constants (units, simulation defaults).

Note: shared constants currently mirror engine values; a future milestone can
move the source of truth here without breaking the engine.
