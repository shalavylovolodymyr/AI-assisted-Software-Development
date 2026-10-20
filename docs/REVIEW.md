# Final engineering review

## Latest operational reporting and controls review — 20 October 2026
The read-only Operations query preserves inward dependencies and existing atomic,
locked/versioned mutations. UTC cutoffs, missing/baseline risk, valid completed
work and active-only overdue flags have regression coverage. The final backend
suite passes 76 tests with 98.58% Domain/Application coverage; the frontend has
19 passing tests, including six workbook tests.

Overview and Charts now serve different purposes. Real XLSX downloads retain
filters, full pagination, selected ranges, numeric values and dates. The final
18-case production browser run passes, including the four business workflows,
role scopes and desktop/mobile controls. Buttons/search use filled backgrounds
and 20px corners; counters and risk/status labels use pills. The sidebar toggle
shares the list's 40px rows and 4px gaps. Neutral dark surfaces, shadow removal,
full modal blur and simplified matrix geometry remain consistent.
The final screenshot-readiness check exposed an older rule hiding Export at phone
widths. Compact exports now remain visible, and both final responsive/control
cases pass. The 18-case full run precedes that final one-property mobile fix.

Agent review found no material unresolved backend correctness issue in the final
source. Earlier browser failures and the corrected radius conflicts are retained
in evidence. The owner chose to keep the live API running; the final overdue
flag and 91+ day label refinements await its next normal restart. The live
operational endpoint is already available. These are agent checks, with no
human review, ADR acceptance, Docker execution or publication implied.

Earlier review notes below describe preceding product revisions.

Subsequent owner clarification restores a plain sidebar menu: transparent rows
at rest, subtle corners and hover/selection backgrounds. Filled 20px action and
search controls remain. Two focused production-browser cases pass in both themes
and desktop/mobile states; actual updated captures were inspected. The API and
business behavior were unchanged.

The subsequent height correction uses one 40px variable for action controls,
selectors, filters, icons, calendars, tabs and aligned single-line fields. Three
focused production-browser checks pass in desktop/mobile Light/Dark views;
computed-height assertions include modal, workflow, pagination and discussion
actions. Plain sidebar styling and matrix proportions remain verified. No backend
behavior or running API changed.

## Architecture
Seven pure domain dataclasses, explicit enums/errors and framework-independent rules.
Application repository/UoW protocols, four main use-case services and thin HTTP routes.
SQLAlchemy mapping is separate. Import checks enforce inward boundaries. Query
aggregation favors clarity for this small capstone portfolio.

## Business behavior
Every issue status pair has a rule test. Mitigation, cancellation, later reassessment,
reopening and immutable history are covered. Parent locks and versions serialize
aggregate changes. Business events share the mutation transaction. The all-cancelled
plan interpretation is explicit in PROJECT/specs/ADR-003.

## Quality assurance
Real PostgreSQL verifies relations, rollback, migrations, history, aggregation,
seed invariants and concurrent stale writes. Browser tests traverse the four
critical workflows and responsive navigation. Unit tests collect without
HTTP/database fixture imports. Limits appear in VALIDATION.md.

## Product design
Owner-directed Light/Dark/System appearance, self-hosted Inter, Lucide, desktop
sidebar/mobile drawer, custom Radix controls, a rounded floating blurred header,
restrained card/control rounding, hidden scroll indicators, owner-requested
removal of focus outlines with keyboard interactions retained,
confirmations and accessible errors. Shared semantic chart colors follow the
theme. Menu separators and summary-card hover arrows are removed. Home views
focus existing admin, manager and member roles on their portfolio/project/own
work, respectively; navigation remains available. Every matrix cell has fictional seeded issues.
Charts derive from persistent records; history is searchable, filterable and paginated.
Status/severity include text and do not rely on color alone. Desktop/mobile
screenshots were inspected. Navigation and mutations use real application behavior.
The desktop sidebar can be hidden/restored from the header, and its state persists.
Theme regressions include KPI hover surfaces, donut tooltip text, high-risk matrix
labels and the checked active-only filter. Default analytics cover 365 days, with
stored-data workload, mitigation pace and category charts. The fictional seed
spans 372 days, preserving previous records and edits.
The latest shell refinement adds a Charts navigation destination for every role,
puts risk plots beside issue assessments and replaces the inline search with a
command dialog. Sidebar branding and repeated guidance are removed; a quiet
footer retains demo disclosure. Completion and filter checks now share neutral
theme tokens. An additive cohort of 250 irregular cases brings the portfolio to
529 issues without rewriting the original history.
Sidebar and content movement share a smooth transition, while search/form
overlays dim the background without blurring it. New issue sits above navigation.
Trend metrics use the shared card surface, chart entry follows reduced-motion
preferences and project bars use a muted theme color. Production-bundle browser
checks cover these details; the visible search shortcut hint is removed.
The lifecycle summary now shares category metric styles, with status counts and
amber bars in four desktop/two mobile columns. Status links remain intact while
numbered/check circles, arrows and dividers are removed. Light, dark and mobile
captures were inspected; the focused regression passed twice.
The latest revision moves page titles/actions into one shared app toolbar and
stabilizes sidebar shortcut rows across desktop/mobile and collapse states. It
removes the footer, softens critical score surfaces, removes matrix entrance
animation and repeated cell text, and simplifies discussion typography/composer.
The current code passed static/build/component checks; a fresh visual/browser
review remains pending automatic approval-review availability. Previous captures
must not be treated as a review of these newest screens.
Subsequent browser verification became available. The account gap's inherited
dropdown alignment was corrected and measured at 10px on desktop/mobile. Current
desktop/header/drawer screenshots were inspected. System appearance now has an
app-wide provider rather than a listener limited to Settings. Twelve component
tests pass; the complete browser run passed eleven scenarios and the remaining
appearance/role scenario passed separately. See the latest VALIDATION.md entry.

The latest controls/settings revision passes the full 14-case production browser
suite and 14 component tests. Actual light/dark hover, square matrix/dividers,
uniform workflow buttons, desktop Settings and mobile Settings/drawer captures
were inspected. The header now shares a solid sidebar surface; obsolete blur
declarations were removed after detecting a CSS compilation conflict. The first
sidebar row controls expansion, with explicit desktop/mobile visibility.
Persisted preferences drive density, reduced motion, trend defaults and actual
query polling. Preference parsing rejects stale/invalid values. Domain and
application behavior, immutable histories and atomic mutations are unchanged.
These are agent checks, not owner approval or formal ADR acceptance.

The final Activity/flat-surface follow-up passes all 15 browser scenarios and
14 component tests. Activity's three cards share the Overview KPI styles; its
chart occupies a separate panel. Search inputs have a filled neutral background.
All CSS shadow declarations and the chart tooltip shadow are disabled; forms,
menus and search use thin borders. Actual Light/Dark form/search and desktop/
mobile Activity captures were inspected. Transparent modal/search backdrops
preserve the underlying page colors, while dialog focus/close behavior remains
covered. No backend behavior or development data changed.

## Academic assessment
Specifications precede core implementation. TDD records actual red/green results.
AI_USAGE describes agent scope and human responsibility. Architecture/ER diagrams,
CI, five-minute demo/fallback material and a refreshed editable eight-slide
presentation with current product screens are included.
Docker execution and GitHub CI remain pending. No deployment or human approval
has been invented.
