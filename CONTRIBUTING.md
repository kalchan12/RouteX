# Contributing to RouteX

RouteX is a university capstone project. Contributions are welcome via pull
requests. This document describes the project conventions.

## Development setup

Follow the **Environment setup** and **Running locally** sections in the
[README](../README.md). Key tools: `uv` (Python), `pnpm` (frontend), `pytest`,
`ruff`, `vitest`, `playwright`.

## Branching and workflow

- `main` — stable, reviewed code only.
- `develop` — integration branch where feature branches merge.
- Feature branches: `feature/<name>` (e.g. `feature/astar-routing`).
- Never commit directly to `main`.
- Open a pull request for every change; keep PRs small and focused.

## Code style

- **Python**: black-formatted, ruff-checked (`ruff check engine scenarios tests
  apps/api`). Enums are `StrEnum`. FastAPI `Depends` in default args uses the
  `B008`-ignored idiom.
- **TypeScript**: strict TypeScript, eslint (`next/core-web-vitals`), no
  `any` where avoidable.
- No comments unless they add real value; prefer descriptive names.
- Follow existing patterns in neighboring files.

## Commit messages

Use conventional commits:

```
feat: add astar pathfinding
fix: correct congestion calculation
test: add astar pathfinding tests
docs: document dijkstra cost function
refactor: extract movement logic into module
```

## Testing

- **Engine**: `uv run pytest tests` — every algorithm and simulation feature
  needs tests (determinism, correctness, edge cases).
- **API**: `cd apps/api && uv run --project . pytest`.
- **Frontend**: `cd apps/web && pnpm test` (Vitest) and `pnpm typecheck`.
- **E2E**: `pnpm test:e2e` (Playwright) — keep to a small smoke suite.
- Determinism: simulations with the same scenario + seed + config must produce
  identical results. Never break this.

## Security (mandatory)

- Never commit `.env`, keys, or secrets — see `.gitignore` and `.env.example`.
- Never hard-code secrets; read them from environment variables.
- Review your staged diff with `git status` and `git diff --staged` before
  committing. Never `git add .` blindly.

## Adding a scenario

1. Add a `scenarios/<name>.json` file following the schema of existing ones.
2. Validate it loads: `uv run python -c "from scenarios import load_scenario; print(load_scenario('<name>'))"`.
3. Add a test in `tests/` if it exercises new behaviour (e.g. events).

## Adding a routing algorithm

1. Implement `RoutingAlgorithm` (see `engine/routing/interface.py`).
2. Register it in `engine/routing/registry.py`.
3. Add correctness + determinism tests in `tests/algorithms/`.
4. Document the algorithm and its cost function in `docs/algorithms/`.
