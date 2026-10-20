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

## Operational analytics and Excel reporting — 20 October 2026
Five new operations-query tests were executed before implementation: **5 failed**
with the missing query. The first implementation made those five pass. Further
boundary tests exposed exact-30-day freshness, missing-versus-baseline risk and
future-record denominator issues (**4 failed, 4 passed**), then **8 passed**.
A shared-overdue regression and age-label check then failed (**2 failed, 7 passed**)
before aligning the Actions/Summary flag with active-only operational counts and
renaming the final age bucket to 91+ days. The updated nine tests passed.
Evidence: product-operations-red.txt, product-operations-green.txt,
product-operations-regression-red.txt, product-operations-unit-green.txt and
product-operations-overdue-red.txt/product-operations-overdue-green.txt.

The full guarded PostgreSQL/API/unit suite passed **76 tests**, with **98.58%**
combined Domain/Application coverage and 100% operations/query coverage.
Read-only analytics preserve the existing mutation/audit architecture.
Six export component tests cover native dates/numbers, literal formula-looking
strings, empty data, sheet names, inline errors and analytics/operations workbook
round-trips. The complete frontend suite passed **19 tests** after removing the
obsolete success-toast test. Workbook exports and styling are UI work; the core
test-first claim above applies to the operational query calculations.

The initial complete browser run passed **15/16** and found an older checkbox
radius rule overriding the shared control style. That specificity conflict was
fixed. A subsequent run was intentionally interrupted after new 20px/filled-control
references arrived. The final browser result is recorded in VALIDATION.md; no
interrupted run is claimed as a pass. Real XLSX downloads are parsed and checked
against API counts, filtered records, selected periods and native date cells.

The first complete 18-case run passed **16/18**. Both failures traced to the same
older `.select-trigger:not(.account-control)` rule retaining 10px corners, while
the new common control rule used 20px. The canonical rule now uses 20px, and the
intermediate 16px button rule was removed. The search-close assertion allows its
contrasting filled surface while still requiring 20px corners. Initial output is
retained in `product-analytics-browser-20px-initial.txt`. A separate attempt could
not start the isolated API because the sandbox blocked local PostgreSQL access;
it ran no scenarios (`product-analytics-browser-sandbox.txt`). The authorized
retry uses the dedicated test database and leaves the development API running.

The complete suite then passed **18/18 (3.2m)**. Screenshot review prompted
data-ready waits in the rounded-control case. Those waits exposed an older mobile
rule hiding Export at 390px; the focused failure is retained in
`product-analytics-mobile-export-initial.txt`. Explicitly showing the compact
export control fixed it. The final two responsive/control cases passed **2/2
(30.9s)** with loaded Light/Dark desktop/mobile captures. This is presentation
regression evidence, not a new core business TDD claim.

## Apple-inspired action-button corners — 20 October 2026
Standard action buttons now use 16px corners; compact and icon actions use 20px.
This presentation-only change is not claimed as test-first business behavior.

## Sidebar menu correction — 20 October 2026
The owner clarified that the filled 20px control style excludes the sidebar menu.
Its selectors were removed from the shared fill/corner overrides, restoring its
earlier transparent, 8px navigation rows and transparent 10px account control.
The existing both-theme browser case now distinguishes plain menu rows from
filled action/search controls and retains the geometry/mobile assertions.
This is a presentation correction, not a new business-behavior TDD claim.
The focused sidebar/control scenarios passed **2/2 (39.6s)**, including plain
menu rows in both themes, desktop collapse and mobile spacing. ESLint and the
production build passed; see `sidebar-menu-correction-browser.txt`.

## Uniform control height — 20 October 2026
The existing both-theme control scenario now checks actual 40px heights for
actions, filters, search, workflow controls, icon buttons, tabs, comment submission,
pagination, calendars, form selectors and mobile controls. Plain menu styling and
sidebar geometry checks remain. The stylesheet shares one height variable across
these controls. This is a presentation regression, not new core-business TDD.
All three focused browser scenarios passed **3/3 (35.0s)**, with matching filters,
keyboard controls, calendars and both-theme desktop/mobile heights. ESLint,
Prettier and the production build passed; evidence is in
`uniform-control-height-browser.txt` and the companion static-check logs.

## Input corner consistency — 20 October 2026
Text fields and text areas use the same 20px radius variable as action controls,
including the discussion field in its focused state. This reversible CSS change
reuses the existing both-theme desktop/mobile browser scenario for visual and
interaction verification; no new business behavior or test-first claim is made.
That existing scenario passed **1/1 (24.5s)**. ESLint, Prettier and TypeScript/Vite
also passed; actual Light/Dark form screenshots were inspected.

## Search close-button alignment — 20 October 2026
The owner's screenshot exposed the full-height close button cutting into the
search field's rounded end. The button now sits beside the input with an 8px gap,
preserving the shared 40px sizing. The existing control scenario clicks Close
search and checks dismissal in both themes; the existing search journey retains
keyboard navigation, Escape and mobile bounds. This is UI regression verification,
not a new core-business TDD claim.
The two existing focused scenarios passed **2/2 (29.3s)**. ESLint, Prettier and
TypeScript/Vite passed; desktop/mobile search captures were visually inspected.

## Welcome sessions and deletion activation — 20 October 2026
Four component checks were written and executed before session implementation;
all four failed because the app automatically chose an actor and offered no entry
or logout flow (`welcome-session-red.txt`). They now pass, covering legacy actors,
explicit selection/login, reload persistence, logout/preferences and invalid
saved identities. The full frontend suite passes **24 tests**.

A DELETE CORS preflight regression was also executed before the correction: it
returned 400 instead of 200 (`welcome-delete-cors-red.txt`). Adding DELETE to the
HTTP adapter's allowed methods makes it pass. No new domain behavior was added
by UC-006; UC-005's prior deletion tests and business rules remain intact.
The complete guarded PostgreSQL/unit/API suite passes **85 tests**, with 532/539
Domain/Application statements covered (**98.70%**).

The first targeted production-browser run passed **4/4 (26.6s)** for welcome,
deep links, login/reload/logout, mobile, stale sessions, cross-tab logout and
issue/action delete/restore. Visual review prompted explicit dark brand color,
removal of inherited workspace padding and data-ready screenshot waits. Final
full browser results are recorded in VALIDATION.md. Initial sandbox attempts at
database access failed; these are retained separately and are not claimed as
test passes. The successful runs use isolated schemas in `signal_test`.

The development database received only the existing additive migration, with
before/after counts checked and all existing deletion timestamps null. A live
fresh-browser check used login/logout and read-only navigation, saw Delete on an
issue and reported no JavaScript errors; it did not mutate business records.

The complete browser run passed **21/23** and exposed an interaction race on
saved-session reload. Loading now precedes validated workspace rendering, with
an additional component regression (**24 frontend tests** total). Its other
failure was the existing calendar assertion reading geometry before Radix
placement; the unchanged bounds requirement now polls for final placement.
The two failing cases and three new session journeys passed **5/5 (26.2s)** in
the focused rerun. See `welcome-session-browser-full-initial.txt` and
`welcome-session-browser-recheck.txt`; no later full-suite pass is claimed.

## Welcome logo contrast — 20 October 2026
The supplied light-mode crop showed the logo tile almost blending into the page.
Its tile and waveform now use the contrasting ink/on-ink pair. The existing
welcome journey checks actual wordmark, tile and SVG stroke colors in Light/Dark,
and the existing mobile entry journey checks the responsive result. This is a
presentation correction, not a new business-behavior TDD claim.
The two existing focused journeys passed **2/2 (10.5s)**; lint, formatting and
the production build passed. Actual updated desktop/mobile captures were inspected.

## Phone viewport, controls and exposure — 20 October 2026
Three focused mobile-browser regressions were executed before the correction;
all three failed (`mobile-layout-initial.txt`). At 320px, an issue detail expanded
its layout/content width to 418px. Exposure sectors extended outside their SVG,
and a search input rendered at 11px rather than the expected mobile 16px.

The corrections are presentation work: wrapped issue actions below the title,
16px editable controls, square dynamic-height navigation/scrim, and proportional
exposure radii with a stacked mobile legend. The new checks passed **3/3 (38.1s)**
on the first corrected build. Visual inspection then found the scrim inheriting
the global button corners; its explicit square edge is included in the final
verification. No new domain behavior or business-behavior TDD claim is made.
The final mobile run passed **3/3 (38.3s)**; five affected existing scenarios
passed **5/5 (1.1m)**. Final build/lint/format checks pass. Physical iPhone Safari
was not automated; input font sizes and viewport scale were checked in mobile
Chromium emulation. Evidence and screenshots are recorded in VALIDATION.md.

## Mobile pagination spacing — 20 October 2026
The cramped phone footer is a presentation correction. It uses two rows, equal
Previous/Next widths, 12px button labels and the existing shared 40px height.
The existing responsive browser scenario checks 320/375px bounds and spacing in
both themes, plus real Next/Previous navigation on Issues, Actions and Activity.
No new business behavior or core TDD claim is made.
The focused existing scenario passed **1/1 (29.2s)**, including real pagination
on all three registers. Lint, formatting and build checks passed; screenshots
were visually inspected. See `mobile-pagination-browser.txt`.
