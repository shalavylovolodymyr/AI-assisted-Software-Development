# Test-first evidence

19 October 2026, local Codex execution. No commits or CI runs are claimed.

1. Wrote `tests/integration/test_workflow.py` before persistence/API code;
   wrote `tests/unit/test_rules.py` and `test_services.py` before domain/services.
2. Ran `.venv/bin/pytest backend/tests/unit -q`: exit 2, two collection errors,
   `ModuleNotFoundError: signal_app.domain` and `signal_app.application`.
3. Added entity/port signatures and explicit NotImplementedError behavior;
   the next run checks that tests fail for missing behavior rather than imports.

4. Signature/stub run: exit 1, **42 failed, 2 passed** (NotImplementedError).
5. Implemented domain scoring/workflow and transactional application services.
   Same unit command: exit 0, **44 passed in 0.03s**.
6. Integration acceptance run before fixtures: exit 1, seven missing-fixture errors.
   This is setup evidence, not a behavioral red/green claim for persistence.

Subsequent actual results are appended during implementation. Test-first claims
apply to these core rules/use cases; UI styling and tooling are not claimed as TDD.

## Later regression and validation

- API/persistence acceptance tests passed: 7 tests against actual PostgreSQL.
- Expanded database/API suite passed: 59 tests, 97.43% Domain/Application coverage.
- Active-only regression first had a test-fixture project-code collision, then
  failed behaviorally with `assert 24 == 18`. After the filter: 1 passed.
- Final expanded suite reached 60 passing tests. See evidence/backend.txt for
  captured output. A subsequent fixture-scope correction keeps framework imports
  out of the unit test collection; it is checked again in final validation.
- Frontend unit tests: 9 passed after correcting a test selector and Node storage fake.
- First browser run: 4 failed on select labels, 1 responsive scenario passed.
  Explicit labels fixed the app; all 5 workflows subsequently passed.
- Stable screenshot assertions wait for the closing mobile drawer animation.

The refactor extracted common validation/audit helpers, mapped ORM/domain records
explicitly, formatted source, and isolated database fixtures. The relevant suites
were rerun after changes; the final results live in VALIDATION.md.

## White interface follow-up — 20 October 2026
The restyle changes presentation and UI controls; it does not change domain or
application behavior. No test-first claim is made for styling. Existing frontend
form/filter tests were adapted to operate the custom accessible dropdowns.

A new browser scenario covers dropdown typeahead, custom checkbox state, calendar
arrow/month navigation, date clearing, nested Escape dismissal, consistent Inter,
white mode under a dark system preference, and mobile calendar bounds. It caught
incompatible Radix dismissal-layer versions closing the parent form. Versions were
aligned. Explicit focus-restoration assertions also fixed a test that opened the
next menu before the closing calendar had returned focus. Open-menu screenshots
use the viewport: full-page capture can resize it, which closes selects by design.
Final results are in
VALIDATION.md and evidence/restyle-browser.txt.

## Analytics and expanded history — 20 October 2026
- Wrote daily replay/empty-series tests before implementing analytics: 2 failures
  for the missing `Queries.trends` method. After implementation, both passed.
- Wrote an additive expansion acceptance test before seeding implementation: it
  failed importing the missing `seed_history`, then passed with every matrix cell
  populated, thousands of events, preserved edits and valid resolved workflows.
- The API test exposed date bucketing at midnight: a PostgreSQL local-offset
  creation was missing from the current UTC day. Added a unit regression first;
  it failed with `0 == 1`. UTC normalization made it pass.
- Final backend run: 65 passed; Domain/Application coverage 97.70%, analytics 100%.
- Frontend: 10 tests pass, including preservation of totals in partial chart weeks.
- Browser validation now covers analytics ranges/refresh, all matrix cells,
  history search/filter/pagination, square controls, hidden indicators, and actual
  mobile scrolling. An initial full browser run overlapped an HMR edit and left
  a request pending; the unchanged-source rerun passed all seven scenarios.

UI styling is not claimed as test-first. See analytics-backend.txt and
analytics-browser.txt in evidence for captured results.

## Role home and appearance refinement — 20 October 2026
A role-scope API regression was written before implementing assignee filtering.
The initial execution required the local database to finish startup; that is
setup evidence. The actual behavioral red was `assert 1 == 0` for another owner.
After filtering before pagination, the test passed. The full backend suite reached
66 passing tests, 97.70% combined Domain/Application line coverage.

Browser checks cover stored Light/Dark/System selection, live system changes,
dark portal controls, role-specific home screens, owner scoping and manager reload.
Presentation and styling changes are not claimed as test-first. Captured results
are in modern-backend.txt and modern-browser.txt under evidence.

## Year history and chart aggregation — 20 October 2026
Before extending the additive seed, the expanded-history acceptance assertion
failed with `252 >= 365`. Increasing the append-only seed range by 60 older
resolved cases makes it span 372 days. The same acceptance verifies idempotency,
preserves an edited issue and its assessments, and validates all resolved cases.
The full backend suite then passed: 66 tests, 97.70% Domain/Application coverage.

Before adding the mitigation chart aggregation, the frontend regression failed
because weekly results omitted `completed_actions`. The implementation now sums
all recorded completions, including the final partial week; all 10 frontend tests
passed. Styling and sidebar changes are not claimed as test-first. Actual red
outputs are year-history-red.txt and year-charts-red.txt under evidence.

## Varied cases and chart/search discovery — 20 October 2026
A new integration acceptance was executed before the varied-case implementation.
It failed with `0 >= 200` for the missing new case cohort. The implementation then
passed both history acceptances, covering unique titles, varied dates/hours and
durations, several action/review counts, idempotency, preserved edits and valid
resolution evidence. The full backend suite passed: 67 tests, 97.70% combined
Domain/Application coverage. Evidence: navigation-variety-red.txt,
navigation-variety-green.txt and navigation-backend.txt.

The header/sidebar/search and copy changes are not claimed as test-first. Browser
regressions exercise chart navigation for members, inline issue charts, live
search by reference, keyboard selection, empty results, mobile layout and completed
action checkmark contrast. Existing workflow and query tests remain in the suite.

The later motion refinement adds browser checks for opening/closing navigation,
reduced-motion handling, dim-only overlays, trend card surfaces and muted project
bar color. It changes presentation behavior, not business rules. Browser checking
uses the production bundle, while generated report files are excluded from the
development watcher after a screenshot run observed an unexpected document reload.
The first production run passed ten scenarios but exposed a leftover search
backdrop blur. CSS prefix/minification left the earlier unprefixed blur effective.
Removing the original blur declarations fixes the source rather than relying on
a later vendor-prefixed override. This actual failure is retained in
evidence/motion-production-blur-red.txt; the final result is in VALIDATION.md.
An intermediate run coincided with a change from panel animation to plotted-data
reveal, leaving the old animation assertion stale. The check now verifies the
actual plot's reveal and its reduced-motion behavior. The donut tooltip check
also targets rendered slice geometry instead of a hard-coded viewport offset.
That intermediate output is retained in evidence/motion-production-layout.txt.
The subsequent 11-scenario pass was followed by screenshot inspection, which
found temporarily blank mobile area plots: Recharts' default animation was still
active alongside the CSS reveal. The library animation is now explicitly disabled
on these plots, leaving one preference-aware reveal. The preceding pass remains
in evidence/motion-browser-before-visual-review.txt; final captures are rechecked.
The next full run passed ten cases but the existing light-mode test sampled a
computed color synchronously immediately after the theme attribute changed.
It now uses Playwright's polling CSS assertion to wait for the rendered white
surface. This timing failure is retained in evidence/motion-theme-timing.txt.
The final full run passed ten scenarios; the donut hover remained intermittent
around scrolling and SVG coordinates. SVG-relative hover attempts also failed
because the SVG surface intercepted their target. The final check waits for
returned select focus, uses viewport hit testing to find the rendered slice and
moves the real browser pointer there. Two focused repeats passed (33.7s).
No forced clicks or synthetic mouse events are used.

The lifecycle follow-up reuses existing category styles and keeps status links.
It is a presentation change, not a test-first business-rule implementation. The
same repeated browser case verifies four meters, retained links, light/dark
captures and two mobile columns. Final evidence is in lifecycle-browser.txt.

## Aligned header, icon rail and lifecycle shares — 20 October 2026
This owner-directed presentation change is not claimed as test-first core
behavior. Existing browser checks now cover a persistent 64px icon rail rather
than fully hidden navigation, reload persistence, named links/tooltips, aligned
toolbar controls and navigation/page-heading centers, and all-status denominators
on lifecycle meters. No application/domain mutation rules changed.

An initial browser run was deliberately interrupted after four workflow passes
to correct desktop header stacking above the sidebar; it is not a completed run.
The focused alignment/motion scenario then passed (11.0s). Captured outputs are
rail-browser-interrupted.txt and rail-layout.txt. Final full-run evidence and
reviewed captures are recorded in VALIDATION.md.

## App toolbar, risk surfaces and discussion — 20 October 2026
These are presentation changes, not test-first business rules. A new component
regression verifies that the shared header shows the current page's one heading
and actions, removing stale actions when the page changes. All 11 frontend tests
passed. Domain/application rules, immutable comments and versioned mutations were
not modified. Build/type checking initially caught a removed composer's unused
user binding; the binding was removed and the checks rerun.

Browser scenarios were updated for appearance on Settings, the shared toolbar,
no footer, softer scores, animation-free matrix, persisted discussion submission
and mobile drawer behavior. Those revised scenarios have not run: automatic
approval review for the preceding optional capture rerun failed because its usage
limit was reached. That rejected action was not executed or bypassed. Prior
browser/screenshot evidence must not be presented as verification of this UI.

## Account gap and final header verification — 20 October 2026
Browser checking became available again. A focused case measures the actual gap
between the profile avatar and name in desktop and mobile layouts, and verifies
that collapse preserves shortcut row positions. It also checks header alignment,
matrix simplicity, quiet risk surfaces, comment persistence and mobile Escape.
Two focused cases passed (20.8s). A first attempt failed because its assumed issue
fixture did not have a critical assessment; the risk-color check now uses the
critical-filtered register. The failed attempt is retained in
profile-header-fixture.txt. The final mobile header capture waits for drawer
closure rather than capturing halfway through the existing closing transition.
These are presentation regressions, not a new core behavior TDD claim.

The first complete run passed seven scenarios and exposed a real System-mode
regression: after leaving Settings, the media-query listener was unmounted and
the UI stayed dark when the system changed to light. A new component regression
was executed before adding an app-wide AppearanceProvider (failed because the
provider did not yet exist). The provider now remains mounted across routes;
all 12 frontend tests pass, including system changes after the control unmounts.
Evidence: profile-appearance-red.txt and profile-header-unit.txt.

Other initial-run failures were stale browser assumptions: an action selector
opens a confirmation dialog rather than restoring trigger focus, the mobile
global create action is named New issue, and the fixed mobile header is at zero.
The helper/assertions were updated to those actual interactions. Captured initial
output remains in profile-shell-browser-initial.txt; final output is recorded in
VALIDATION.md. No backend rules or development data were changed.
The corrected complete run passed 11/12 cases; only appearance data-readiness
remained after repeated document reloads in the test helper. Changing that helper
to real Settings/sidebar navigation and back history preserves the app's query
cache. The remaining appearance/role scenario passed (15.6s). This is not claimed
as a subsequent complete 12/12 run.

## Shared controls and preferences — 20 October 2026
Two component tests cover invalid/stale saved preferences and persistence across
provider remounts, including explicit false values. The frontend suite now has
14 passing tests. These UI preferences and style changes are not claimed as
test-first core business implementation.

New browser checks cover distinct hover surfaces in both themes, square matrix
cells and one-pixel dividers, matching workflow/filter controls, and preference
effects across routes/reloads. The first focused run passed two cases and failed
two: an old header blur declaration survived compilation, and the polling check
advanced its clock before a pending fetch settled. Obsolete blur rules were
removed; clock installation and fetch readiness were corrected. The next run
passed settings behavior, including disabled/enabled polling, but its workflow
fixture was OPEN rather than IN_PROGRESS. The test now selects an actual
in-progress issue. See VALIDATION.md for the final complete-run result.
An earlier run was intentionally interrupted before results when duplicate
mobile/desktop sidebar controls were found during CSS inspection; it is not a
validation pass. All browser runs use the isolated test database.

The subsequent Activity/flat-surface request adds a browser scenario comparing
Activity cards with Overview KPI styles, checking filled search fields, checking
computed shadows on every rendered element, and opening/closing both forms and
command search with transparent backdrops in Light/Dark modes. Mobile Activity
also receives an overflow/layout check. These are presentation regressions;
there is no new business-behavior TDD claim.
The final full run passed **15/15 browser scenarios (2.3m)**. All **14 component
tests**, TypeScript/build, ESLint and Prettier passed. Actual desktop/mobile and
modal/search captures were inspected; see `flat-surfaces-browser-final.txt`.

The subsequent matrix-corner adjustment updates the existing both-theme browser
assertion from 0px to 6px. It is a small presentation change, not a new
test-first business behavior claim.

The owner's subsequent modal request restores background blur with transparent
overlays. Existing assertions now check 8px blur and a mobile overlay covering
the full viewport; **2/2 browser scenarios passed (17.9s)**. This is a visual
preference change, with no new business behavior or core TDD claim.
