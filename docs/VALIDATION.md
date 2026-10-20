# Local validation evidence

Implementation session: 19–20 October 2026, Europe/Zurich. Actual local commands and
observations only. No GitHub run, external deployment or human review is claimed.

## Verified results
| Check | Result |
|---|---|
| Backend unit + real PostgreSQL integration + API suite | 76 passed |
| Domain/Application coverage | 98.58% combined; domain, analytics, operations and queries 100%, services 95% |
| Frontend Vitest / Testing Library | 19 passed |
| Chromium Playwright | 18 passed (preceding full suite, 3.2m); latest control-height checks 3/3 passed |
| Ruff lint and format | Passed |
| Frontend ESLint and TypeScript | Passed |
| Frontend production build | Passed; vendor/chart bundles split and ExcelJS loaded only on export |
| npm dependency audit | Zero known vulnerabilities at installation/audit time |
| Alembic upgrade and test downgrade/upgrade | Passed against local PostgreSQL |
| Seed repeated twice | No duplicate or altered records |
| Concurrent writes | One succeeds, one stale conflict; one audit transition |
| Pure imports with Python `-S` | Domain/Application import without site-packages |
| Desktop/mobile visual inspection | Actual app screenshots reviewed |
| Editable presentation | 8 rendered slides reviewed; package/layout/font/import checks passed |

Captured backend and production-build output lives in `docs/evidence/`.
Browser reports/traces are generated in ignored `frontend/playwright-report` and
`frontend/test-results`. Fifty-seven retained screenshots live in `docs/screenshots`.
They come from the isolated E2E portfolio and include temporary test issues.
The PPTX was rendered with Artifact Tool and was not opened in native PowerPoint.

## Commands
From the repository root with local PostgreSQL running:

```bash
.venv/bin/pytest backend/tests --cov=signal_app.domain --cov=signal_app.application --cov-fail-under=90 --cov-report=term-missing --cov-report=xml -q
npm run test:frontend
npm run test:e2e --workspace frontend
.venv/bin/ruff check backend scripts
.venv/bin/ruff format --check backend scripts
npm run lint --workspace frontend
npm run typecheck --workspace frontend
npm run format:check
npm run build
.venv/bin/python scripts/check-artifacts.py
```

Tests use `signal_test` with unique temporary schemas. The browser runner creates
and removes its own schema and starts ports 8001/5179. Development data is separate.
No destructive reset was run against the development database.

## Observed failures and fixes
TDD.md records missing modules, 42 behavior failures and subsequent 44 unit passes.
PostgreSQL initially needed sandbox permission for shared memory/loopback sockets.
Frontend tests had an ambiguous selector and Node Storage setup problem.
Browser tests failed four journeys because select labels lacked explicit accessible
names. Explicit labels made all five scenarios pass. The active-only regression
failed with 24 instead of 18, then passed. Mobile screenshot capture now waits for
drawer closure. Presentation checks caught a font-property mismatch and a missing
runtime path; both were corrected before final export.

## Verification limits and release checklist
- **Docker execution is unverified here.** `docker compose version` returned
  `command not found: docker`. Compose, Dockerfiles, startup migrations, health
  checks and CI container smoke tests are implemented. Install Docker and run
  `docker compose up --build`, verify health, reload persistence and clean restart.
- GitHub Actions is configured with least privilege, PostgreSQL, test artifacts
  and pinned action revisions. It has not run on GitHub.
- ADRs remain Proposed. Human review and manual publication are outstanding.
- External deployment is outside authorization and has not happened.
- No production authentication, load testing, accessibility certification,
  penetration testing or cross-browser verification is claimed.

The features and native local path are implemented and verified. The full master
Definition of Done remains open at container runtime validation.

## White-interface validation — 20 October 2026
- Frontend unit suite: 9 passed; ESLint, TypeScript, formatting and production build passed.
- Chromium Playwright: all 6 scenarios passed in the final complete run (17.0s).
  The existing four issue workflows and responsive navigation remain covered.
- The added control scenario verifies keyboard dropdown selection, checkbox state,
  calendar arrow/month navigation and clearing, nested Escape dismissal, Inter
  throughout, white surfaces under a dark system preference, and mobile bounds.
- Desktop overview, register and identity menu inspected in the actual local app.
  Updated desktop/mobile matrix, calendar and dropdown screenshots retained.
- No visible native select, date or checkbox controls remain. Browser primitives
  still provide hidden form integration; the visible controls are app-styled.
- Dependency installation audit: zero known vulnerabilities. Radix UI packages
  share one dismissal/focus implementation after version alignment.
- Captured final browser/build output: evidence/restyle-browser.txt and
  evidence/restyle-build.txt. At that stage backend code was unchanged; the
  60-test result came from the preceding implementation validation.
- The existing presentation retains its original branding; this follow-up updates
  the application UI and current app screenshots.

## Minimal design, expanded history and analytics — 20 October 2026
- Complete backend suite: **65 passed**, combined Domain/Application coverage
  **97.70%**; the new analytics module is covered at **100%**.
- Frontend suite: **10 passed**. TypeScript/production build, ESLint, Ruff and
  formatting checks passed.
- Final complete Chromium run: **7 passed (42.1s)**. New coverage includes all
  25 populated matrix cells, stored-data trend ranges/manual refresh, history
  filtering/search/pagination, square geometry and actual mobile scroll behavior
  with indicators hidden. Existing create/edit/reassess/resolve/reopen/blocking
  workflows still pass against real PostgreSQL.
- Local demo inspected: **219 issues, 93 active, 126 resolved, 1,212 assessments,
  633 actions, 3,657 audit events**, all 25 matrix cells populated. The local event
  total includes earlier demo interactions; a fresh portfolio differs slightly.
- The expansion acceptance test verifies idempotency, preserves an edited issue
  and its original immutable assessments, and validates every resolved case.
- Actual desktop dashboard, matrix, menus, calendar, history and mobile previews
  are retained in screenshots. These use the isolated E2E portfolio, including
  temporary workflow records. The screenshot filenames above remain current.
- Chart bars render complete values immediately; the subtle workspace entrance
  transition respects reduced motion. Automatic data refresh is polling every
  30 seconds while the relevant view is visible, with manual analytics refresh.
- Recorded output: evidence/analytics-backend.txt, analytics-browser.txt and
  analytics-build.txt. All original release/hosting verification limits remain.

## Modern appearance, role homes and presentation — 20 October 2026
- Complete backend suite: **66 passed (10.14s)** with **97.70%** combined
  Domain/Application coverage. The owner-filter contract was observed failing
  before the query and API implementation; see TDD.md.
- Frontend suite: **10 passed**. ESLint, TypeScript, Prettier, production build,
  Ruff lint/format and artifact/import-boundary checks passed.
- Final complete Chromium run: **8 passed (49.6s)** against its isolated test
  schema. This covers persisted Light/Dark/System choice, live system changes,
  dark menus/dialog/calendar, no textarea resize handle, rounded header/cards,
  consistent risk colors, mobile bounds, admin/manager/member home scopes and
  manager reload behavior. All original business workflows remain covered.
- Role views reuse existing roles: admins see the portfolio, managers see an
  owned project plus personal actions, members see assigned issues and actions.
  These are presentation defaults, not an authentication or authorization layer.
- The updated dashboard, manager/member views, dark controls and mobile dark
  layout were captured by Playwright with reduced motion and inspected. The
  Work browser setting disabled interactive local browser access this turn;
  no additional manual browser session is claimed.
- Development records were preserved. No demo reset, external publication or
  deployment was performed. Earlier runs while the dev server was receiving
  edits had transient workflow failures; the final stable-source full run passed.
- The presentation was redesigned as eight editable Inter slides, using current
  app screenshots and a native coverage chart with an embedded data snapshot.
  All eight final-file slides were rendered and reviewed. Structural, geometry,
  font, chart-workbook and Artifact Tool import checks passed. It has not been
  opened in native PowerPoint. The original deck remains backed up privately.
- Captured outputs: evidence/modern-backend.txt, modern-browser.txt and
  presentation-modern-validation.json. A final appearance-only run passed
  (1 scenario, 9.5s) after adding data-ready waits for the mobile dark screenshot;
  see evidence/modern-visual.txt. All original release limits still apply.

## Hover contrast, sidebar and year charts — 20 October 2026
- The complete backend suite passed: **66 tests (13.50s)**, **97.70%** combined
  Domain/Application coverage. The history acceptance observed 252 days before
  implementation, then verified at least 365 days, seed idempotency, preserved
  edits/assessments and valid evidence for every resolved issue.
- **10 frontend tests passed** after adding weekly completion totals, including
  partial weeks. TypeScript/production build, ESLint, Prettier, Ruff lint/format
  and artifact/import-boundary checks passed.
- The final complete Chromium run passed **all 9 scenarios**. New assertions
  cover white KPI surfaces on hover, no focus outlines, dark donut-tooltip text,
  dark high-severity matrix foreground/background, selected-cell label contrast,
  the checked active-only filter, sidebar hide/restore/reload persistence, mobile
  navigation while desktop collapse is stored, 365 timeline days and category
  counts from the actual analytics response.
- The first browser attempt passed the existing eight scenarios but the new
  tooltip hover assertion failed because its target was below the viewport.
  Scrolling the actual donut into view made the complete nine-scenario run pass.
- Current local portfolio observed through the real API: **279 issues**, **93
  active**, **186 resolved**, **365 returned timeline days** and **276 changes in
  the first 30 days**. A fresh deterministic seed spans 372 days. Existing local
  edits add one assessment/two comments beyond the seed baseline; they remain.
- New workload, weekly completed-action and category charts use stored records.
  Dashboard and history start at 365 days. No historical row was rewritten and
  no reset was run. The additive seed command was rerun successfully without
  duplicates; no records needed changing on that repeat.
- Updated app screenshots were inspected, including dark-risk-tooltip.png,
  dark-matrix.png, dark-active-filter.png and year-dashboard.png. The PowerPoint
  remains the preceding presentation snapshot; it was not edited in this follow-up.
- Evidence: year-history-red.txt, year-charts-red.txt, year-backend.txt,
  year-browser.txt (initial attempt) and year-browser-final.txt. All prior
  deployment, Docker, human-review and native-PowerPoint limits remain.

## Chart discovery, search and varied demo history — 20 October 2026
- The full backend suite passed: **67 tests (25.03s)**, **97.70%** combined
  Domain/Application coverage. The varied-cohort acceptance failed with `0 >=
  200` before implementation, then passed alongside the history-preservation and
  resolution-evidence checks. New case titles, dates, durations and action/review
  counts vary, while stable IDs make the extension reproducible and idempotent.
- **10 frontend tests passed**. TypeScript/production build, ESLint, Prettier,
  Ruff lint/format and artifact/import-boundary checks passed.
- Final complete Chromium run: **10 passed (1.7m)**. Added coverage checks the
  Charts sidebar link for members, issue-level risk plots, no sidebar logo or
  header breadcrumb/demo clutter, footer disclosure, live reference search,
  arrow/Enter behavior, empty results, Escape, fast Enter submission, mobile
  search bounds and completion/filter checkmark contrast.
- An initial run passed nine cases but the calendar check failed when a full-page
  screenshot resized an open popover. Viewport-sized calendar capture passed in
  isolation and in the final complete run. No bypassed clicks or forced actions
  were used to hide the failure.
- The local additive seed completed and a repeat reported no changes. Observed
  local records: **529 issues, 2,843 assessments, 1,541 actions, 1,304 comments and
  8,778 audit events**; the oldest issue is from **14 August 2025**. Local edits
  account for small differences from a pristine seed. No reset or replacement of
  existing historical rows was performed.
- Updated screenshots include command-search.png, mobile-search.png,
  minimal-issue.png, minimal-sidebar.png and charts-page.png. Final screenshot
  capture waits for chart data and drawer placement; this is automated browser
  QA, not a native interactive browser session or accessibility certification.
- Evidence: navigation-variety-red.txt, navigation-variety-green.txt,
  navigation-backend.txt, navigation-browser.txt (initial failure),
  navigation-calendar.txt and navigation-browser-final.txt. The existing local
  preview is reused. Docker, GitHub, external deployment, human ADR review and
  native PowerPoint verification remain outside the completed evidence.

## Motion, chart surfaces and matching lifecycle — 20 October 2026
- The final production build, ESLint and Prettier checks passed. Frontend unit
  tests passed **10/10**; backend behavior is unchanged since the **67-test** run
  recorded above. Browser QA now serves the production bundle, excluding hot
  reload from workflows while preserving the open development preview.
- The latest complete browser run passed **10 of 11 scenarios (1.7m)**, including
  all four mutation workflows and the new motion checks. The existing donut
  hover test was intermittent. After correcting its rendered hit target, that
  remaining scenario passed **two focused repeats (33.7s)**. No subsequent full
  eleven-scenario pass is claimed. Evidence: motion-browser-complete.txt and
  lifecycle-browser.txt.
- Motion assertions cover shared sidebar/content timing, hidden/restored
  navigation, dim-only search/form backdrops, KPI-style trend cards, no visible
  shortcut badge, muted dark project bars, plotted-data reveal and reduced motion.
  CSS prefixing initially left a search blur effective in production; removing
  the original blur declarations fixed it. That failure is retained in
  motion-production-blur-red.txt.
- Screenshot inspection caught mobile plots temporarily blank while the chart
  library's default animation ran alongside the reveal. The library animation is
  now explicitly disabled. Final desktop/mobile chart captures show every plot,
  with reduced motion rendering data immediately.
- Issue lifecycle reuses category styles, retains four filtered status links and
  replaces numbered circles/checks/arrows/dividers with counts and proportional
  amber bars. The repeated browser case verifies links, four meters, no icons,
  light/dark appearance and a two-column mobile layout. The three lifecycle
  captures were inspected alongside refined-charts.png and charts-page.png.
- Earlier development-server reloads and outdated animation/instant theme-color
  assertions are retained in motion-browser.txt, motion-production-layout.txt
  and motion-theme-timing.txt. SVG-relative hover targeting also failed; final
  hover uses browser hit testing and a real pointer movement, without forced
  clicks or synthetic events. No development rows were reset or replaced.
- The presentation remains the preceding snapshot. Existing Docker, GitHub,
  deployment, human-review and native-PowerPoint limits still apply.

## Aligned rail follow-up and current app shell — 20 October 2026
- Before the latest shell revision, the complete browser suite passed **10/11
  (1.6m)**. The analytics scenario exceeded a five-second data-ready wait. With an
  explicit fifteen-second wait, it passed in isolation (**20.4s**). Evidence:
  rail-browser.txt and rail-analytics-final.txt. Alignment/motion also passed in
  isolation (**11.0s**, rail-layout.txt). An earlier run was deliberately stopped
  for a stacking correction; rail-browser-interrupted.txt is not a completed run.
- The subsequent optional icon-rail capture rerun was rejected before execution:
  automatic approval review could not complete because its usage limit was
  reached. This was an approval-service failure, not a finding that the command
  was unsafe. The action was not retried through another route.
- The current app shell, footer removal, soft risk scores, count-only matrix and
  discussion composer have **not** had a browser/visual rerun. The existing
  screenshots describe preceding versions. Revised browser cases are prepared,
  including comment submission/reload, but no passing result is claimed.
- Current checks: **11 frontend tests passed**, TypeScript/production build,
  ESLint, Prettier and artifact/import-boundary checks passed. The new component
  regression verifies one current toolbar heading, current actions and removal
  of stale actions. Evidence: app-shell-frontend.txt, app-shell-build.txt,
  app-shell-lint.txt and app-shell-format-check.txt.
- Backend source and data are unchanged in this follow-up. The **67-test** backend
  result above remains the preceding backend validation, not a new execution.
  Docker, GitHub publication/CI, external deployment, human ADR review and native
  PowerPoint verification remain outside the completed evidence.

## Profile gap and verified app layouts — 20 October 2026
- The account control inherited `justify-content: space-between` from the shared
  dropdown. Its own style now aligns content to the start with a **10px gap**,
  a fixed 28px avatar and a truncating name. Browser geometry checks confirm the
  gap on desktop and inside the mobile drawer. Header/drawer icons share a 40px
  control size, while shortcut rows stay at the same height across rail states.
- Focused shell checks passed **2/2 (20.8s)**. The final complete run passed
  **11/12 (2.1m)**, including all mutation workflows, mobile controls, matrix,
  search, lifecycle, discussion persistence and account/header geometry. The
  remaining appearance/role case passed in isolation **(15.6s)** after navigating
  Settings through the actual sidebar/back history rather than repeatedly
  reloading and abandoning dashboard requests. No later full 12/12 pass is
  claimed. Evidence: profile-header-browser.txt,
  profile-shell-browser-final.txt and profile-appearance-browser-final.txt.
- The first full run also exposed a real System-mode regression from locating
  the preference listener inside Settings. AppearanceProvider now stays mounted
  for the app lifetime. A new component regression verifies system changes in
  both directions after the control unmounts; **12 frontend tests passed**.
  Production build, ESLint, Prettier and artifact/import-boundary checks passed.
- Actual app-shell-desktop.png, app-shell-mobile-drawer.png and
  app-shell-mobile-header.png were inspected. The final header capture waits for
  drawer closure. Current screenshots show close account spacing, aligned header
  controls, unchanged shortcut positions and no footer. Earlier unverified-shell
  notes above describe that preceding checkpoint, not the current result.
- Initial fixture, outdated focus/button/header expectations and the System-mode
  failure remain in profile-header-fixture.txt, profile-shell-browser-initial.txt
  and profile-appearance-red.txt. Unit/lint/format output is retained in
  profile-header-unit.txt, profile-header-lint.txt and profile-header-format.txt.
  No development data was reset and no backend rule changed. Existing release,
  publication, human-review and native-PowerPoint limits remain.

## Solid shell, clear controls and working preferences — 20 October 2026
- The complete production-bundle Chromium suite passed **14/14 (2.2m)**,
  including all existing business workflows and the two new presentation/settings
  scenarios. Evidence: `controls-settings-browser-final.txt`.
- Both themes verify that the header has no backdrop filter and matches the
  sidebar surface, hovered records remain distinct from badges, matrix cells
  are square, issue dividers are exactly 1px, workflow targets share a style and
  alignment, and overdue filters match select controls' sizing and typography.
- Settings tests verify persistence after reload, compact/comfortable record
  spacing, reduced motion despite an animated system preference, the default
  90-day trend range and background polling off/on with a controlled browser
  clock. The mobile Settings page has no horizontal overflow.
- **14 frontend tests passed** across seven files. ESLint, TypeScript,
  production build and Prettier passed. Evidence: `controls-settings-unit.txt`,
  `controls-settings-lint.txt`, `controls-settings-build.txt` and
  `controls-settings-format.txt`. The final browser command also rebuilt the
  final source before running. Backend source was unchanged and the backend
  suite was not rerun in this follow-up.
- Earlier attempts are retained honestly: the interrupted run has no completed
  result; the initial focused run passed 2/4 and exposed the compiled header
  blur conflict plus a clock-readiness problem; the corrected run passed
  settings and failed on an OPEN rather than IN_PROGRESS workflow fixture.
  These are `controls-settings-browser-interrupted.txt`,
  `controls-settings-browser-initial.txt` and
  `controls-settings-browser-corrected.txt`.
- Inspected and retained light/dark hover, matrix and workflow screenshots,
  desktop Settings and mobile Settings/drawer captures. Eight new PNGs bring
  the retained total to **39**; the three existing app-shell captures were
  refreshed. The presentation remains the preceding eight-slide artifact.
  Development data, backend rules, publication and formal review status remain
  unchanged.

## Activity KPI cards and flat dialogs — 20 October 2026
- The final complete production-bundle browser suite passed **15/15 (2.3m)**.
  Evidence: `flat-surfaces-browser-final.txt`, including the final TypeScript and
  Vite build. **14 component tests**, ESLint and Prettier passed again:
  `flat-surfaces-unit.txt`, `flat-surfaces-lint.txt`, `flat-surfaces-format.txt`.
- The added browser case compares Activity cards directly with Overview KPI
  surface/radius/padding; verifies search fields match neutral controls; checks
  every rendered element for box/text/drop shadows; and checks transparent,
  unblurred modal/search overlays in both themes. Menu and form open/close checks
  pass. Mobile Activity retains three cards and has no horizontal overflow.
- Inspected actual desktop/mobile Activity, light/dark forms and dark command
  search screenshots. The page retains its original colors behind the form and
  command dialog. Seven new `flat-*.png` captures bring the retained total to
  **46**; all existing retained screenshots were refreshed from the final run.
- No backend code/data or business rules changed. The existing 67-test backend
  result is the preceding verification. No new backend run, deployment,
  publication, owner review or presentation refresh is claimed.

## Softer matrix corners — 20 October 2026
Full and compact matrix cells now share a subtle **6px radius**. The existing
both-theme browser scenario passed **1/1 (15.6s)**, including square proportions,
selection/list dividers and the new radius. TypeScript/build and Prettier passed.
Evidence: `matrix-soft-corners-browser.txt`, `matrix-soft-corners-format.txt`.
Light/Dark matrix captures were inspected and refreshed. The preceding 15-case
full-suite and 14-component-test results above were not rerun for this small
CSS adjustment. No business behavior changed.

## Full background blur behind dialogs — 20 October 2026
Modal and command-search overlays now use **8px full-viewport blur**, including
the header/sidebar, with no tint or shadows. Two existing browser scenarios
passed **2/2 (17.9s)** in Light/Dark and responsive mobile layouts, including the
mobile overlay's full 390×844 viewport bounds and dialog dismissal. TypeScript/
build, ESLint and Prettier passed. Evidence:
`modal-full-background-blur-browser.txt`, `modal-full-background-blur-lint.txt`,
`modal-full-background-blur-format.txt`. Actual desktop/mobile captures were
inspected; four dialog/search screenshots were refreshed and one mobile capture
added (**47** retained). Earlier no-blur notes record the preceding preference.
The 15-case full suite and component suite were not rerun for this CSS change.

## Apple-inspired action-button corners — 20 October 2026
Standard actions now use 16px corners; compact, icon, pagination and page-toolbar
actions use 20px. Matrix cells retain their existing corner shape. Styling was
checked in the running browser and through the frontend production build.

## Operational analytics, Excel and shared rounded controls — 20 October 2026
- Complete backend suite: **76 passed (31.49s)**, including real PostgreSQL/API
  tests, with **98.58%** Domain/Application coverage. Operations and Queries have
  100% coverage. The guarded test database uses isolated schemas; no development
  data was reset. Evidence: `product-operations-backend.txt` and the red/green
  calculation regressions recorded in TDD.md.
- **19 frontend tests passed** across eight files. Six tests exercise workbook
  round-trips, native dates/numbers, literal formula-looking text, empty results
  and inline export errors. Final ESLint, Prettier and artifact/import checks
  passed. Ruff lint/format passed for all 41 backend/script files. Evidence:
  `product-analytics-unit.txt`, `product-analytics-lint.txt`,
  `product-analytics-format.txt`, `product-analytics-artifacts.txt` and
  `product-operations-ruff.txt`.
- The final complete production-bundle browser run passed **18/18 (3.2m)**:
  `product-analytics-browser-final.txt`. It covers the original four mutation
  workflows, both themes, system appearance, role homes, responsive navigation,
  filled 20px controls/search, 40px sidebar rows with 4px gaps, the 10px profile
  gap, 6px matrix cells, 1px dividers, full-viewport dialog blur and no shadows.
- Screenshot review then found two register captures taken before data arrived.
  Adding data-ready waits exposed an old responsive rule hiding Export at 390px
  (`product-analytics-mobile-export-initial.txt`). The compact export control now
  explicitly stays visible. The final focused responsive/control check passed
  **2/2 (30.9s)** after that CSS change, including loaded registers, enabled mobile
  Export and a visible drawer account control. Evidence:
  `product-analytics-rounded-captures.txt`. A second full 18-case run after this
  final one-property mobile fix is not claimed.
- Overview now shows planning/review gaps, action outlook, project health and
  overdue work. Charts owns historical flows/trends and current age, risk movement
  and owner-workload breakdowns. Browser assertions compare current KPI values
  and each due-date drill-down with API results. Current snapshots are labeled
  separately from the selected historical period.
- Real XLSX downloads were parsed for Overview, selected-range Charts, matrix,
  Projects, Issues, Actions, Activity, issue risk history and manager scope.
  Assertions cover full filtered pagination, 25 matrix cells, typed numbers and
  dates, selected periods, query filters and scoped records. Routine mutation
  and identity success popups are removed; validation/server errors remain.
- Initial full runs are retained honestly: **15/16** found a checkbox radius
  conflict; **16/18** found the older Select rule retaining 10px corners. Both
  source conflicts were corrected. An intervening run was deliberately stopped
  for the owner's new visual references. A separate attempt ran no scenarios
  because the sandbox blocked local PostgreSQL; the authorized retry passed.
  See `product-analytics-browser-initial.txt`,
  `product-analytics-browser-20px-initial.txt`,
  `product-analytics-browser-interrupted.txt` and
  `product-analytics-browser-sandbox.txt`.
- TypeScript/Vite passed in the final browser command. ExcelJS is a separate,
  lazy-loaded export chunk (940.20 kB minified, 269.87 kB gzip); Vite reports its
  size warning. It is fetched when an export is requested. The final npm audit
  found **zero known vulnerabilities**; initial advisory output and the patched
  UUID dependency update are retained alongside the final audit JSON.
- Actual Overview, deeper Charts, matrix, rounded Light/Dark controls, forms,
  search and mobile drawer screenshots were inspected. The original 47 captures
  are refreshed, with ten additions for analytics and the rounded controls
  (**57 total**). The eight-slide deck remains the preceding presentation snapshot.
- The owner explicitly chose **Keep API running** after automatic approval review
  rejected stopping it. No development API process was stopped or restarted.
  The live API already serves operational health. Final active-only overdue
  flags and the corrected “91+ days” label are verified in the isolated API and
  will load at the next normal restart. The existing frontend server supplies
  the updated UI. Docker, GitHub, external deployment and human review limits
  above remain unchanged.
  A final read-only `/health` request returned `status: ok` and
  `database: connected` while that API remained running.

## Plain sidebar menu correction — 20 October 2026
The owner clarified that filled, pill-shaped controls exclude the sidebar menu.
Navigation/shortcut rows again have transparent resting backgrounds and 8px
corners; the account row has its earlier transparent surface and 10px corners.
Only hover/selection adds a row background. Action controls and search retain
their filled 20px treatment. Sidebar geometry and behavior are unchanged.

The two focused production-browser scenarios passed **2/2 (39.6s)** across
Light/Dark, expanded/collapsed navigation and mobile. Assertions explicitly
distinguish menu styling from action/search controls and retain 40px row/4px gap
checks. ESLint, scoped Prettier and TypeScript/Vite passed. Evidence:
`sidebar-menu-correction-browser.txt`, `sidebar-menu-correction-lint.txt`.
Actual light/dark registers and the dark mobile drawer were inspected; 16
targeted captures were refreshed. Other retained screenshots document preceding
visual revisions. No backend code, API process or data changed; the preceding
full backend/frontend suites were not repeated for this CSS correction.

## Uniform 40px control height — 20 October 2026
Action buttons, icon buttons, selectors, filters, tabs, calendar buttons and
comment submission now share `--control-height: 40px`. Search and single-line
form fields align at the same height. Icon actions, including mobile exports,
are 40px square. Plain sidebar styling and 40px list rows remain intact; data-grid
cells, status indicators and multiline fields retain their existing geometry.

Three focused production-browser scenarios passed **3/3 (35.0s)**, checking the
actual heights in Light/Dark desktop/mobile views, pagination, form selectors,
calendar controls, discussion/workflow actions and matching filter styles.
Keyboard calendar/dropdown behavior, mobile bounds, menu styling and matrix
proportions also pass. ESLint, Prettier and TypeScript/Vite passed. Evidence:
`uniform-control-height-browser.txt`, `uniform-control-height-lint.txt` and
`uniform-control-height-format.txt`. Actual register/form captures were inspected
and 17 targeted screenshots refreshed. Backend code, API process and data were
unchanged; the full backend/frontend suites were not repeated for this CSS change.

## Input corners match buttons — 20 October 2026
Text inputs, multiline form fields and the discussion composer now share the
buttons' 20px radius variable, including focused text areas. Text padding keeps
content clear of the rounded edges. The 40px single-line heights and plain menu
styling remain unchanged.

The existing both-theme desktop/mobile control scenario passed **1/1 (24.5s)**
without adding a new test for this small CSS change. ESLint, Prettier and the
TypeScript/Vite build passed. Actual Light/Dark form captures were inspected and
eight targeted screenshots refreshed. Evidence: `rounded-input-fields-browser.txt`,
`rounded-input-fields-lint.txt` and `rounded-input-fields-format.txt`. No backend,
data, API-process or business-behavior change was made; broader suites were not
rerun for this field-rounding refinement.

## Search close-button alignment — 20 October 2026
The close action now sits beside the search field with an 8px gap. Both controls
remain 40px high and the icon uses the regular neutral fill/hover styling,
avoiding the full-height white circle inside the field shown in the owner's
screenshot. The shared search header keeps the input flexible on mobile.

Two existing production-browser scenarios passed **2/2 (29.3s)**. They cover
actual close-button clicks in both themes, keyboard search/Enter/Escape, result
navigation and mobile bounds. ESLint, Prettier and TypeScript/Vite passed.
Desktop empty/result search and mobile result captures were inspected; targeted
screenshots were refreshed. Evidence: `search-close-button-browser.txt`,
`search-close-button-lint.txt`, `search-close-button-format.txt`. No backend,
running API or development data changed. Broader suites were not rerun for this
layout correction.

## Welcome, login/logout and deletion activation — 20 October 2026
- Full frontend suite: **24 passed** (`welcome-session-unit.txt`).
- Full backend suite against isolated PostgreSQL test schemas: **85 passed**,
  **98.70%** Domain/Application coverage (`welcome-deletion-backend.txt`).
- ESLint, whole-frontend Prettier, Ruff checks/format and TypeScript/Vite pass;
  the existing lazy ExcelJS chunk-size warning remains. See
  `welcome-session-lint.txt`, `welcome-session-format.txt`,
  `welcome-session-ruff.txt` and the build output in `welcome-session-browser-recheck.txt`.
- Targeted browser entry/deletion checks passed **4/4 (26.6s)**. Initial evidence is retained in
  `welcome-session-browser-initial.txt`. Four component failures and the failing
  DELETE preflight are retained in `welcome-session-red.txt` and
  `welcome-delete-cors-red.txt` before their implementations.
- The live API's missing deletion capability was verified. Additive migration
  `9b6e81f0d523` preserved all seven table counts; all existing issues/actions
  retained null deletion timestamps (`welcome-deletion-local-migration.txt`).
  The original API on 8000 was not stopped. Updated API 8002 and frontend 5178
  both report healthy database connections; the frontend config reports
  `deletion: true`. The frontend's ignored local env override routes to 8002.
- A fresh browser on the actual app URL checked welcome → login → Issues →
  visible Delete → logout, with **zero JavaScript errors** and no business-data
  mutations (`welcome-session-live.txt`). Desktop Light/Dark and 320/390px
  welcome captures and the live deletion screenshot are retained.
- The initial sandboxed database checks could not connect; the subsequent
  authorized test runs passed. Docker, publication, actual CI and human-review
  limitations above remain unchanged.

The complete browser run passed **21/23 (4.8m)**
(`welcome-session-browser-full-initial.txt`). It exposed a saved-session loading
race: on a mobile Settings reload, welcome's Appearance control briefly appeared
before the user catalog loaded, then unmounted during selection. Saved sessions
now show loading until validated. A fifth component regression covers that state.
The other failure repeated the prior calendar check reading x=0 before Radix
finished placement; the failure screenshot already showed its correct position.
The assertion now waits for the same viewport bounds, without relaxing them.

Both failing cases and all three new session journeys then passed **5/5 (26.2s)**
(`welcome-session-browser-recheck.txt`), including persistent preferences, refresh
behavior and calendar geometry in both themes at 1440/390/320px. The final
frontend suite is **24/24**, and final lint/format/build checks pass. The complete
23-case suite was not repeated after these focused corrections; the earlier
21 passing scenarios include the real issue/action deletion and restoration flow.
Actual final welcome and live deletion screenshots were visually inspected.

## Welcome logo visibility — 20 October 2026
The logo tile now uses charcoal/white in Light and light/dark in Dark, with the
wordmark retaining its theme text color. Two existing production-browser journeys
passed **2/2 (10.5s)**, checking actual Light/Dark wordmark, tile and SVG colors,
login/logout and 390/320px mobile entry. Updated desktop/mobile screenshots were
visually inspected. ESLint, scoped Prettier and TypeScript/Vite passed. Evidence:
`welcome-logo-browser.txt`, `welcome-logo-lint.txt`, `welcome-logo-format.txt`.
This CSS correction changed no backend or business data; broader suites were
not repeated.

## Mobile clipping, input focus and navigation — 20 October 2026
The three phone screenshots were inspected. A fresh mobile-emulated live browser
also reproduced the issue actions extending beyond 375px and exposure sectors
outside the SVG. The page overflow expanded the layout viewport, also distorting
the apparent navigation height. Before correction, three focused scenarios failed:
320px issue content grew to 418px, the exposure sectors were clipped, and the
register search input used 11px text (`mobile-layout-initial.txt`).

Issue actions now occupy their own mobile row and wrap within the viewport.
Editable fields use 16px before/after focus, the drawer follows `100dvh` with
safe-area padding and square rows/scrim, and the exposure ring uses proportional
radii above its mobile legend. The first corrected build passed **3/3 (38.1s)**
(`mobile-layout-first-green.txt`). Visual inspection prompted an explicit square
scrim, which had inherited the common button radius.

Five existing scenarios passed **5/5 (1.1m)** for responsive navigation, desktop
chart tooltips/contrast, the app header/discussion, shared Light/Dark controls and
actual issue/action deletion/restoration (`mobile-layout-regression.txt`). They
use isolated PostgreSQL test schemas. The final mobile rerun is recorded below.
ESLint, Prettier and TypeScript/Vite pass; the existing lazy export chunk warning
remains. No backend or development business records were changed.

Mobile checks use Chromium touch/mobile emulation at 320/375/390/430px and both
themes. They assert layout/content/visual viewport widths, scale 1, complete Delete
visibility and confirmation, sector bounds, square navigation at 844/667/568px
heights, reachable logout, and 16px search/form/assessment/discussion fields before
and after focus. Physical iPhone Safari and its virtual keyboard were not driven;
the sizing correction addresses the small-field focus zoom shown by the owner.

Final mobile verification passed **3/3 (38.3s)**, including the square scrim
(`mobile-layout-browser.txt`). The five affected existing scenarios also pass;
the complete 26-scenario suite was not repeated for these layout changes.
Actual Light/Dark issue-action, exposure, square-drawer and focused-input captures
were inspected. Seven screenshots are retained under `mobile-issue-actions-*`,
`mobile-exposure-*`, `mobile-square-drawer-*` and `mobile-input-focus.png`.
Static evidence is in `mobile-layout-lint.txt` and `mobile-layout-format.txt`;
the final production build is recorded with the browser output.

## Roomier phone pagination — 20 October 2026
The existing responsive browser scenario passed **1/1 (29.2s)**. It checks equal
Previous/Next widths, 40px height, 12px labels, separate summary spacing and
viewport bounds at 320/375px in both themes. Actual Next/Previous navigation
passed on Issues, Actions and Activity. Four pagination screenshots were captured;
Light/Dark samples were visually inspected. ESLint, Prettier and TypeScript/Vite
passed (`mobile-pagination-browser.txt`, `mobile-pagination-lint.txt`,
`mobile-pagination-format.txt`). This CSS-only refinement changed no backend or
business data; broader suites were not repeated.
