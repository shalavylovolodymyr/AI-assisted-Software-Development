# AI-assisted implementation record

## Agent and authorization
OpenAI Codex was the coding agent. The owner supplied the complete product mission,
technology stack, assessment requirements, visual direction, business rules,
delivery boundaries and autonomous local implementation authorization in
[MASTER_PROMPT.md](MASTER_PROMPT.md). The initial directory was empty.

## Agent responsibilities and observed milestones
1. Inspected the filesystem, Python/Node tooling and the three supplied references.
2. Wrote project context, four specifications and architecture proposals before implementation.
3. Wrote integration acceptance tests and unit tests before core implementation.
4. Observed missing-module failures, then 42 behavior failures on explicit stubs.
5. Implemented pure domain rules and application services; 44 unit tests passed.
6. Added SQLAlchemy mapping, real PostgreSQL, Alembic, API contracts and deterministic seed.
7. Built the React workspace, forms, charts, matrix and lifecycle operations.
8. Ran database/API tests and browser journeys, inspected screenshots, corrected failures.
9. Added CI/Compose, documentation, a local editable presentation and verification records.

## Decisions and human responsibility
The master prompt selected FastAPI, PostgreSQL, React, clean layers and demo identity.
Codex chose transaction/UoW implementation details, parent-row locks with versions,
terminal action semantics, and explicit handling of all-cancelled mitigation plans.
These choices appear in proposed ADRs. No separate human architecture acceptance
or code review has occurred. The owner should review before publication/submission.

## Testing and correction evidence
See TDD.md and VALIDATION.md for commands and actual results. Browser testing exposed
implicit select labels that did not match their visible names reliably. Explicit
accessible labels fixed the workflows. Tests also caught an active-issues drill-down
returning resolved records. The regression failed with 24 instead of 18 before the fix.
An initial regression fixture itself collided with a seeded project code; the fixture
was isolated before judging the application behavior.

The initial npm pins produced 20 advisory findings. Reviewed patched versions reduced
the npm audit result to zero. Frontend test setup needed an explicit Storage fake under
Node 26; this was a harness correction. The app works with browser localStorage.
PostgreSQL and local HTTP binding needed sandbox permission on this machine.

## Review and learning outcomes
- Pure rules made edge cases, including equal reassessment/completion times, cheap to test.
- PostgreSQL tests established real foreign-key, rollback and lock behavior.
- Browser tests found interaction problems that unit tests did not reveal.
- A polished screen does not establish workflow correctness or deployment readiness.
- Specifications and resumable task/evidence records reduced assumptions between phases.
- AI output still needs human review, dependency review and release decisions.

## Limits on claims
Core rules and four use-case services have actual test-first evidence. Styling,
infrastructure and every additional branch are not claimed as strict TDD cycles.
No commits, conversations with other agents, human approvals, GitHub CI outcomes,
external deployments or learning reflections from the owner have been invented.
The eight-slide presentation is agent-authored supporting material for human review.
