# RouteX — AI Agent Instructions

> This file defines the mandatory rules for AI agents working on RouteX.

---

# 1. Mission

You are an AI software engineering agent working on RouteX.

Your job is to:

- Understand the existing system
- Follow the documented architecture
- Implement tasks safely
- Preserve working functionality
- Keep documentation synchronized
- Test changes
- Update project progress
- Avoid unnecessary scope expansion

You are NOT allowed to treat the repository as disposable.

---

# 2. Mandatory Context Files

Before performing meaningful work, read:

```text
PROJECT.md
ARCHITECTURE.md
DESIGN.md
PLAN.md
```

Then use this priority:

```text
AGENT.md
    ↓
ARCHITECTURE.md
    ↓
PROJECT.md
    ↓
DESIGN.md
    ↓
PLAN.md
    ↓
Source Code
```

---

# 3. Task Startup Protocol

At the beginning of every task:

### Step 1

Read:

```text
AGENT.md
```

### Step 2

Read:

```text
PROJECT.md
```

### Step 3

Read:

```text
ARCHITECTURE.md
```

### Step 4

Read:

```text
DESIGN.md
```

### Step 5

Read:

```text
PLAN.md
```

### Step 6

Inspect the relevant source code.

### Step 7

Determine whether the task is:

- Existing feature
- Bug fix
- Refactor
- New feature
- Architecture change
- Design change
- Documentation task

---

# 4. Plan Before Coding

Do not immediately start editing files.

First determine:

```text
What needs to change?
Why?
Which files are affected?
Which architecture boundaries are affected?
Which tests are affected?
Does documentation need updating?
```

For non-trivial tasks, update `PLAN.md` before implementation.

---

# 5. Architecture Protection

Never silently change architecture.

If a task requires changing:

- Framework
- Database
- State manager
- Renderer
- Build tool
- Runtime
- Backend strategy
- Folder architecture
- Major dependency
- Simulation architecture

STOP.

Do not continue implementation until:

1. The architectural impact is understood.
2. `ARCHITECTURE.md` is updated.
3. `PLAN.md` reflects the change.
4. The change is consistent with `PROJECT.md`.

---

# 6. Current Architecture

The current stack is:

```text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
PixiJS
Zustand
Zod
Dexie.js
IndexedDB
Recharts
Vitest
React Testing Library
Playwright
pnpm
```

Do not introduce:

```text
FastAPI
PostgreSQL
SQLAlchemy
Alembic
Redis
Next.js
Docker backend
Cloud database
Mandatory external AI
```

unless the architecture is explicitly changed.

---

# 7. Local-First Rule

RouteX must remain functional without a traditional backend.

Prefer:

```text
Browser
+
Local computation
+
IndexedDB
```

Do not introduce a server dependency simply because it makes one feature easier.

---

# 8. Simulation Rules

Simulation logic belongs in:

```text
src/core/
```

Do not put simulation logic into React components.

Do not tightly couple:

```text
Simulation
↔
React
```

The simulation should remain testable independently.

---

# 9. Rendering Rules

PixiJS handles simulation visualization.

React handles application UI.

Do not render large numbers of simulated vehicles as individual React DOM elements.

---

# 10. Code Quality

Prefer:

- Small focused modules
- Strong TypeScript types
- Explicit interfaces
- Pure functions where practical
- Deterministic behavior
- Testable logic
- Clear naming

Avoid:

- Giant files
- Giant components
- Circular dependencies
- Global mutable state
- Magic constants
- Duplicate implementations
- Dead code

---

# 11. Do Not Over-Engineer

Do not create abstractions simply because they might be useful someday.

Before adding:

- Interface
- Factory
- Service
- Manager
- Repository
- Utility layer

ask:

> Is there a current requirement that needs this?

If not, prefer the simpler implementation.

---

# 12. Dependencies

Before adding a dependency:

1. Check whether the project already provides the capability.
2. Check whether an existing dependency can solve it.
3. Consider bundle size.
4. Consider maintenance.
5. Consider whether it fits the architecture.

Do not add dependencies casually.

---

# 13. File Organization

Place code according to responsibility.

Examples:

```text
Simulation logic
→ src/core/simulation/

Routing
→ src/core/routing/

Network
→ src/core/network/

Vehicles
→ src/core/vehicles/

Traffic
→ src/core/traffic/

Rendering
→ src/rendering/

State
→ src/stores/

Persistence
→ src/db/

UI
→ src/components/
```

Do not create random top-level directories.

---

# 14. Tests

Every meaningful behavior change should have appropriate tests.

At minimum:

```text
Algorithm changes
→ Unit tests

Simulation changes
→ Simulation tests

UI behavior
→ Component/E2E tests

Persistence
→ Database tests

Major user workflows
→ Playwright tests
```

Never remove tests simply to make the test suite pass.

---

# 15. Validation

After meaningful changes, run appropriate checks.

At minimum where applicable:

```bash
pnpm build
pnpm test
```

For UI changes:

```bash
pnpm test:e2e
```

Also inspect:

```bash
git diff
git status
```

Never assume a change works because the code looks correct.

---

# 16. Security

Never commit:

```text
.env
API keys
Passwords
Tokens
Private keys
Credentials
Database dumps
Sensitive user data
```

Use:

```text
.env.example
```

for configuration templates.

---

# 17. Generated Files

Do not commit:

```text
node_modules/
dist/
coverage/
__pycache__/
*.pyc
*.tsbuildinfo
*.db
*.egg-info/
```

---

# 18. Git Safety

Before staging:

```bash
git status
git diff
```

Before committing:

```bash
git diff --staged
```

Do not blindly run:

```bash
git add .
```

without checking what will be committed.

Do not rewrite history or force-push unless explicitly instructed.

---

# 19. Documentation Synchronization

If implementation changes:

- Architecture → update `ARCHITECTURE.md`
- Product scope → update `PROJECT.md`
- UI/design → update `DESIGN.md`
- Progress/task state → update `PLAN.md`

Documentation is part of the implementation.

---

# 20. PLAN.md Rule

`PLAN.md` is a living document.

After every meaningful task:

1. Mark completed work.
2. Record important decisions.
3. Record blockers.
4. Add newly discovered work.
5. Update the next recommended task.
6. Keep completed work historical rather than deleting it.

Never leave `PLAN.md` describing work that has already been completed.

---

# 21. AI Journey / Evaluation

RouteX development is also being used to evaluate AI-assisted software engineering.

Therefore, development should be observable.

For meaningful tasks, maintain enough information to evaluate:

- What the AI was asked to do
- What it changed
- Why it changed it
- Whether tests passed
- Whether architecture remained consistent
- Whether documentation stayed synchronized
- Whether unnecessary changes were introduced
- Whether human intervention was required

Do not hide architectural decisions.

---

# 22. AI Must Not Fake Progress

Never claim:

```text
Implemented
Tested
Working
Complete
```

unless there is evidence.

If something was not tested:

> Say that it was not tested.

If something partially works:

> Mark it as partial.

If something is blocked:

> Mark it as blocked.

---

# 23. Handling Ambiguity

If a task is ambiguous but has a safe interpretation:

- Prefer the smallest reasonable implementation.

If ambiguity could cause:

- Architecture changes
- Data loss
- Destructive deletion
- Major scope expansion

stop and ask for clarification.

---

# 24. Handling Existing Code

Existing code may be:

- Correct
- Partially correct
- Temporary
- Legacy
- Experimental

Do not rewrite it automatically.

First determine whether it works and whether it belongs to the current architecture.

---

# 25. Refactoring Rule

Refactor when:

- Duplication is causing problems.
- Architecture boundaries are being violated.
- Code is preventing feature development.
- Tests are difficult because of structure.
- The current implementation conflicts with documented architecture.

Do not refactor merely for aesthetics.

---

# 26. Completion Protocol

Before marking a task complete:

```text
[ ] Implementation complete
[ ] Existing functionality preserved
[ ] Tests added/updated
[ ] Relevant tests pass
[ ] Build passes
[ ] Documentation updated
[ ] PLAN.md updated
[ ] Architecture checked
[ ] Design checked if UI changed
[ ] No accidental files changed
[ ] No secrets introduced
```

Only then mark the task complete.

---

# 27. Final Response Format

After completing a task, report:

```text
Task:
<what was requested>

Implemented:
<what changed>

Files Changed:
<important files>

Tests:
<results>

Architecture:
<changed / unchanged>

Design:
<changed / unchanged>

Plan:
<updated / unchanged>

Remaining:
<any remaining work>
```

Be concise and factual.

---

# 28. Golden Rule

> **Understand → Plan → Implement → Test → Document → Update Plan**

Never:

> Code → Hope → Claim success
