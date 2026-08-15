# Package managers

## Python — uv (chosen)

**Decision: uv is the project's Python package manager.**

Rationale:

- **Speed** — dramatically faster installs and resolution than pip/poetry.
- **Modern UX** — one tool for `pyproject.toml` management, virtualenvs, and
  locked installs (`uv sync`, `uv.lock`).
- **Workspaces** — the root `pyproject.toml` defines a workspace so the API app
  (`apps/api`) can depend on the local `routex-engine` package without publish.
- **Reproducibility** — `uv.lock` is committed, so `uv sync --frozen` in CI
  yields identical environments.

Commands:

```bash
uv sync --all-extras        # install workspace + dev deps
uv run pytest tests         # run tests in the locked env
uv run ruff check ...       # lint
cd apps/api && uv run --project . uvicorn app.main:app ...
```

## Frontend — pnpm (chosen)

**Decision: pnpm is the frontend package manager.**

Rationale:

- **Disk-efficient** — content-addressed store, hard links into `node_modules`.
- **Strict** — non-flat `node_modules` prevents phantom/implicit dependencies.
- **Fast** — parallel installs and good CI caching via `pnpm/action-setup`.

Commands:

```bash
cd apps/web
pnpm install
pnpm dev | build | typecheck | lint | test | test:e2e
```

The lockfile (`pnpm-lock.yaml`) is committed; CI uses `--frozen-lockfile`.
