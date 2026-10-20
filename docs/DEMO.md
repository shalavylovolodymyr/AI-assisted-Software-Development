# Five-minute demonstration

## Before presenting
Use README's native setup or a verified Docker installation. Open the welcome at
http://127.0.0.1:5178, choose **Emma Wilson** (fictional ADMIN) and click **Log in**.
No password is needed. Reload retains this explicit session; **Log out** is at
the bottom of the sidebar, including the icon rail/mobile drawer.
API docs normally use http://127.0.0.1:8000/docs; the current parallel updated API
is at http://127.0.0.1:8002/docs while the original process remains running.
Confirm the database-connected health response.
Use a 1440px desktop viewport or browser zoom suitable for the projector.
All statistics come from PostgreSQL. The fixed seed targets October 2026.
Settings offers Light, Dark and System. Use the
identity menu to briefly compare Daniel Reed's project focus and Oliver Brooks's
personal queue, then return to Emma for the portfolio and issue workflow.

## Live walkthrough
| Time | Scene | Evidence |
|---|---|---|
| 0:00–0:40 | Overview planning/review gaps, then Charts trends and owner workload | Operational health and historical analytics use stored records |
| 0:40–1:15 | Risk Matrix: select likelihood 5, impact 4 | Matching issues appear beside the 5 × 5 matrix |
| 1:15–2:00 | Create “Privileged access review”; likelihood 5, impact 4; explain rationale | Server confirms score 20, Critical; refresh preserves it |
| 2:00–3:00 | Start work; add an action owned by Emma with a due date; try Mark mitigated before completion | Server explains incomplete work; set action DONE and confirm |
| 3:00–4:00 | Mark mitigated; assess likelihood 2, impact 2 after completing work; resolve | Score 4, immutable prior score 20, resolved timestamp |
| 4:00–5:00 | Activity tab, architecture, TDD evidence and API docs | Audited actor/time, clean boundaries, actual tests and configured CI |

Optional: reopen to IN_PROGRESS and show that history remains and resolved_at clears.
The exact order is important: the reassessment must be strictly after the final
required action completion. Resolution does not demand a specific residual severity.
Use Export on Charts to download the chosen range and current breakdowns as XLSX.
Register exports include every filtered page. The account menu switches role homes;
the top sidebar row collapses/restores navigation with the same spacing as other rows.
Open an issue to find its labeled **Delete** button. Unfinished action rows have
their own **Delete** button. Confirm removal, then open **Deleted issues** or
**Deleted actions** in the matching register to restore it. History is preserved;
completed/cancelled actions and immutable assessments/comments cannot be deleted.

## Fallback
Open `docs/presentation/SIGNAL-capstone.pptx` and the genuine application screenshots
in `docs/screenshots`. Screenshots were captured from an isolated browser-test portfolio
that includes E2E-created issues; they are not a substitute for claiming live behavior.
The deck is the preceding visual snapshot; the retained application screenshots
include the latest operational analytics and filled, rounded controls.
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
