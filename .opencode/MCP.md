# RouteX — MCP Usage Guide

> This document defines how AI agents should use MCP tools while working on RouteX.
>
> MCP configuration itself belongs to the OpenCode configuration. This document defines usage policy and project expectations.

---

# 1. Purpose

MCP tools provide AI agents with capabilities that go beyond normal file editing.

Examples may include:

- Browser interaction
- Documentation lookup
- GitHub operations
- Browser inspection
- Testing
- External services

MCP should be used when it provides meaningful evidence or capability.

---

# 2. MCP Is Not a Replacement for Project Rules

Before using MCP:

Read:

- AGENT.md
- PROJECT.md
- ARCHITECTURE.md
- DESIGN.md
- PLAN.md

MCP tools must follow the project's documented architecture and security rules.

---

# 3. When to Use MCP

Use MCP when it materially improves the task.

Good examples:

### Browser Testing

Use browser automation when:

- A UI feature needs verification.
- A simulation workflow needs end-to-end testing.
- A visual interaction needs validation.
- Browser console/runtime behavior needs investigation.

---

### Documentation Lookup

Use documentation-oriented MCP tools when:

- PixiJS API behavior needs verification.
- React integration behavior needs verification.
- A library API is uncertain.
- The installed library version differs from remembered documentation.

Prefer official documentation when possible.

---

### GitHub

Use GitHub MCP when:

- Inspecting repository issues
- Reviewing pull requests
- Checking repository information
- Managing project tasks when explicitly requested

Do not modify repositories remotely unless explicitly authorized.

---

# 4. MCP and Security

Never send sensitive project information to an external MCP service unless explicitly required and authorized.

Never expose:

- API keys
- Passwords
- Tokens
- Private keys
- `.env` contents
- Personal credentials
- Sensitive local files

---

# 5. Local-First Principle

RouteX is local-first.

Do not introduce a cloud service simply because an MCP tool can provide it.

MCP is an AI development capability.

It is NOT part of the RouteX runtime architecture unless explicitly documented.

---

# 6. Browser MCP

When browser MCP is available, it may be used to verify:

- Application startup
- Navigation
- Simulation controls
- Canvas rendering
- Scenario selection
- Metrics
- Errors
- Console warnings

A browser check does not replace unit tests.

---

# 7. PixiJS Documentation

When PixiJS behavior is uncertain:

1. Check the installed PixiJS version.
2. Consult official PixiJS documentation.
3. Verify the API against the actual project dependency.
4. Implement accordingly.

Do not blindly use examples from older PixiJS versions.

---

# 8. External Research

If an MCP tool provides external documentation:

Distinguish between:

- Project facts
- Official documentation
- Community examples
- Agent assumptions

Do not treat an unofficial example as authoritative without verification.

---

# 9. MCP Failure

If an MCP server is unavailable:

Do not stop development unnecessarily.

Use:

- Existing project documentation
- Installed package documentation
- Local source
- Tests

Only report MCP as a blocker when the task genuinely requires that capability.

---

# 10. Tool Selection

Use the smallest tool necessary.

Do not call MCP tools simply because they are available.

Prefer:

Local filesystem
    ↓
Existing project tools
    ↓
MCP
    ↓
External service

when the task can be solved locally.

---

# 11. MCP Configuration Changes

If adding or changing an MCP server:

1. Determine why it is needed.
2. Verify the server is appropriate.
3. Check security implications.
4. Update the project's documentation if the change affects development workflow.
5. Do not commit secrets.
6. Do not silently add external services.

The actual MCP configuration should be maintained in the appropriate OpenCode configuration file, not inside this document.

---

# 12. MCP Evaluation

Because RouteX is also being used to evaluate AI-assisted development, significant MCP usage should be observable.

When useful, record:

- Tool used
- Reason
- Information obtained
- Whether it affected implementation

Do not create unnecessary logs for trivial tool usage.

---

# 13. Golden Rule

MCP provides capabilities.

Skills provide specialized knowledge.

AGENT.md provides behavioral rules.

Architecture.md defines technical reality.

PLAN.md defines current project state.

Do not confuse these responsibilities.
