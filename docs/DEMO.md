# Five-minute demonstration

## Before presenting
Use README's native setup or a verified Docker installation. Open the overview at
http://127.0.0.1:5178 and API docs at http://127.0.0.1:8000/docs. Select **Emma Wilson**
(fictional ADMIN). Confirm the Demo label and database-connected health response.
Use a 1440px desktop viewport or browser zoom suitable for the projector.
All statistics come from PostgreSQL. The fixed seed targets October 2026.
The floating header's appearance menu offers Light, Dark and System. Use the
identity menu to briefly compare Daniel Reed's project focus and Oliver Brooks's
personal queue, then return to Emma for the portfolio and issue workflow.

## Live walkthrough
| Time | Scene | Evidence |
|---|---|---|
| 0:00–0:40 | Role views, appearance and portfolio charts | Scoped queues and values derive from the seeded database |
| 0:40–1:15 | Risk Matrix: select likelihood 5, impact 4 | Matching issues appear beside the 5 × 5 matrix |
| 1:15–2:00 | Create “Privileged access review”; likelihood 5, impact 4; explain rationale | Server confirms score 20, Critical; refresh preserves it |
| 2:00–3:00 | Start work; add an action owned by Emma with a due date; try Mark mitigated before completion | Server explains incomplete work; set action DONE and confirm |
| 3:00–4:00 | Mark mitigated; assess likelihood 2, impact 2 after completing work; resolve | Score 4, immutable prior score 20, resolved timestamp |
| 4:00–5:00 | Activity tab, architecture, TDD evidence and API docs | Audited actor/time, clean boundaries, actual tests and configured CI |

Optional: reopen to IN_PROGRESS and show that history remains and resolved_at clears.
The exact order is important: the reassessment must be strictly after the final
required action completion. Resolution does not demand a specific residual severity.

## Fallback
Open `docs/presentation/SIGNAL-capstone.pptx` and the genuine application screenshots
in `docs/screenshots`. Screenshots were captured from an isolated browser-test portfolio
that includes E2E-created issues; they are not a substitute for claiming live behavior.
If only the frontend is unavailable, show `/docs` and run the API acceptance tests.
If PostgreSQL is unavailable, run `.venv/bin/pytest backend/tests/unit -q` to show the
pure domain/application tests, explain the local infrastructure problem, and use the
presentation to explain the workflow. Do not claim a live demo succeeded in that case.

## Resetting demo data — destructive
Seeding twice preserves existing records. To intentionally reset a **dedicated local**
`signal` demo database, stop the API first, keep PostgreSQL running, and run:

```bash
PYTHONPATH=backend/src .venv/bin/python scripts/reset-demo.py
```

The helper refuses non-loopback hosts or databases other than `signal`, requires
`DEMO_MODE=true`, and asks you to type `RESET SIGNAL`. It permanently deletes all
SIGNAL records before migrating and seeding. It was not executed during validation.
For Compose data, preserve the volume unless you explicitly intend to delete it.
