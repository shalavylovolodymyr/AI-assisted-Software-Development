# SIGNAL — AI-SDLC instructions

Read `docs/TASKS.md`, `docs/PROJECT.md`, then the relevant `docs/specs/UC-00N.md`.
The master request authorizes the complete local lifecycle; external deployment
and GitHub publication remain manual. Keep phase/status and evidence honest.

- Preserve Domain ← Application dependency direction. Neither imports frameworks.
- Interfaces call application services; infrastructure implements repository/UoW ports.
- Write and execute failing tests before implementing core business behavior.
- Keep assessment/comment history immutable and business changes/audit atomic.
- Serialize issue mutations with a database row lock and check expected versions.
- Use isolated PostgreSQL databases for integration tests, never development data.
- Never invent reviews, test results, CI runs, or deployment evidence.
- Keep `docs/TASKS.md`, `docs/TDD.md` and `docs/VALIDATION.md` current.
- Do not push, deploy, overwrite user data, or commit secrets.

Architecture proposals: [ADR-001](docs/adr/ADR-001.md),
[ADR-002](docs/adr/ADR-002.md), [ADR-003](docs/adr/ADR-003.md).
Human review is still required before formal ADR acceptance or publication.
