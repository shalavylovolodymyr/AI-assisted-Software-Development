# SIGNAL

From risk to resolution. FHNW AI-assisted Software Development capstone,
Autumn 2026; requested deadline 29 October 2026.

## Objective and users
An operational workspace for fictional managers and issue owners to detect,
assess, assign, mitigate and resolve issues, retaining a defensible audit history.
Scope: dashboard, issues, risk history/matrix, actions, projects, people, activity.
Excluded: production authentication, multitenancy, email, uploads, billing,
external integrations and LLM inference.

## Architecture and design baseline
Python 3.12+, FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, PostgreSQL.
React/TypeScript/Vite, Tailwind, TanStack Query, Router, React Hook Form/Zod,
Lucide and Recharts. pytest/HTTPX/Ruff, Vitest/Testing Library and Playwright.
Docker Compose and GitHub Actions provide reproducible delivery.

A modular monolith: pure dataclass domain entities/rules; application services
with repository and unit-of-work protocols; HTTP adapters and Pydantic contracts;
SQLAlchemy repositories with row-locking transactions. Dashboard metrics are
derived, never stored. UTC timestamps, browser-local display. See ARCHITECTURE.md.

All seven requested entities are first-class domain records. Four service slices:
create/assess, plan/complete mitigation, reassess, transition/resolve.
Cancelled actions do not block mitigation; at least one DONE action is required
for resolution, and a strictly later assessment must exist. Terminal action states
are immutable. Reopen before planning further work on mitigated/resolved issues.
These interpretations prevent vacuous resolution of an all-cancelled plan.

## Commands
Native startup: `make setup`, `npm run db:start`, then `make migrate`, `make seed`,
`make api` and `make web` in separate terminals as documented in README.
Checks: `make test`, `make lint`, `npm run build`, and
`npm run test:e2e --workspace frontend`. Exact results are in VALIDATION.md.
Compose target: `docker compose up --build` (runtime verification pending because
Docker is absent here). Never run database reset against non-demo data.

## References inspected on 19 October 2026
- [BAIssue](https://github.com/AIaSDev/BAIssue): clean layer boundaries and repository examples; no application code copied.
- [AI-SDLC template](https://github.com/AIaSDev/ai-sdlc-template): inspected router, use-case template and DEVELOP instructions. Adapted artifact names to the requested structure.
- [Canonical methodology](https://docs.aisl.science/learning-and-resources/ai-sdlc): lifecycle and evidence conventions.

The existing workspace was empty, so there were no template artifacts to preserve.
The user's master prompt explicitly selects all local implementation phases.
ADR status remains Proposed until the owner reviews them; implementation is authorized
by the user's specified stack and autonomy instruction, not a fabricated approval.

## Visual direction update — 20 October 2026
The owner's follow-up replaces the master prompt's dark palette with white mode
only. Use white surfaces, charcoal type, neutral gray structure, and restrained
blue/amber accents. Inter is the single UI font, including codes and shortcuts.
Sentence case replaces uppercase labels and slogans. Secondary actions use icons
with accessible names and custom tooltips; primary actions retain concise labels.

Shared styled dropdowns, a custom calendar, checkboxes, tooltips and modals
replace visible browser-default controls throughout filters, forms,
identity selection and action status updates. Radix provides keyboard/focus
primitives; the app owns their appearance. The four Radix packages use compatible
versions so nested dismissal and focus scopes share one implementation.

## Minimal workspace and analytics follow-up — 20 October 2026
All UI corners are square, scroll indicators are hidden without disabling scroll,
and introductions/slogans/repeated captions are removed. The dashboard starts with
summary counts and data charts; a short entrance transition respects reduced motion.

`make seed` now adds 195 fictional cases to the original 24, preserving existing
records and edits. Stable versioned UUIDs make expansion idempotent. Three active
issues are added to each of the 25 matrix cells, alongside 120 resolved cases.
The stored history spans eight months, with 1,212 assessments and 3,600+ events.
This is explicitly demo data, not a live external feed.

`GET /analytics/trends?days=7..365` replays historical status/reopening events and
latest assessments at each UTC day boundary. Metrics include creations,
resolutions, completed actions, assessments and mean creation-to-resolution days.
Missing average risk and resolution durations remain null. Weekly charts preserve
partial buckets. History is searchable and filterable by event type and project,
with 50 records per page; the actions view uses 20 rows per page.

Overview, analytics, issues, actions and history refresh every 30 seconds while
visible. Analytics also offers manual refresh and a fetched-at indicator.

## Modern appearance and role homes — 20 October 2026
The latest owner request supersedes white-only/square styling: Light, Dark and
System modes share semantic tokens across charts, filters, dialogs and calendars.
The preference persists locally; System follows preference changes immediately.
Panels use soft rounding, a sticky translucent header uses blur, menu separators
are removed, and remaining table/form separators have a single 1px border.
Textarea resize handles and redundant row/card arrows are removed. Hidden scroll
indicators and keyboard/pointer scrolling remain available.

Admins start with the portfolio; managers with their owned project's priorities
and personal actions; members with assigned active issues and owned actions.
These are presentation scopes, not security boundaries. All existing navigation
and demo permissions remain. Issue queries now accept an optional assignee_id
filter before pagination, also exposed as a clearable owner filter in the register.
The first project is selected after catalog loading, including on manager reload.

The eight-slide local PPTX is redesigned with Inter, minimal layouts, current
screens, editable text and a native coverage chart. The original is retained in
private build storage before replacing the delivered file.

## Hover contrast, collapsible navigation and year analytics — 20 October 2026
The owner requested removal of focus outlines. Keyboard controls and selected-state
feedback remain functional; no accessibility certification is claimed. KPI cards
retain their theme surface on hover. Chart tooltip item/label colors explicitly
follow the theme instead of inheriting a series/default color. High-severity
matrix cells use a dark amber background with light text in dark mode; checked
filters use the shared accent tokens.

A header button hides or restores the desktop sidebar, persisting the choice
locally. The mobile drawer remains independently usable even when the desktop
sidebar was hidden. The analytics/history default is now 365 days. Open workload,
weekly mitigation pace and category bars use existing persisted analytics fields.
The weekly aggregation includes action completions and retains partial weeks.

The additive demo history now includes 180 resolved expansion cases rather than
120, using new stable issue IDs. The complete fresh seed contains 279 issues and
spans 372 days. Existing rows, assessments, comments and user edits are not rewritten.
Earlier design/history notes above describe prior revisions.

## Chart discovery and minimal shell — 20 October 2026
Charts is a permanent sidebar destination for all three roles. It presents the
365-day portfolio charts and project workload. Each issue also displays its own
risk chart in the current assessment panel, including a single baseline point for
new issues; the assessment list remains immutable and available below.

The header contains sidebar, search, appearance and avatar controls. A command
search dialog provides live title/reference matching, arrow/Enter selection,
Escape dismissal and keyboard opening with Cmd/Ctrl K. Its initial shortcuts
include Charts. Identity names remain in the selector's menu. Sidebar logo and
organization branding are removed, while the footer carries demo disclosure,
connection status and navigation links. Matrix size/intro labels and repeated
workflow/modal guidance are removed. Essential fields, error messages, risk
semantics, timestamps and confirmation flows remain. Checkmarks use explicit
monochrome foreground/background tokens in both themes.

`seed_history` now also appends 250 `history/v2` cases with reproducible seeded
variation: unique topic/system pairs, irregular creation times, variable risk
paths, 1–5 actions, 2–8 reviews, completion intervals and comment counts. Seventy
are active and 180 resolved. The complete seed has 529 cases and more than a year
of history. Existing IDs and all previously stored records are skipped intact.
The read-only charts always use persisted records, not client-side random values.

## Motion and chart-card refinement — 20 October 2026
Sidebar movement and content resizing share a 320ms easing curve. The mobile
scrim fades with the drawer instead of disappearing abruptly; closed navigation
remains hidden from interaction. Modals, search and drawer overlays dim without
background blur. The floating header retains its requested glass treatment.
New issue sits above the sidebar navigation. The visible shortcut hint is removed,
while Cmd/Ctrl K continues to open search.

Trend totals now use individual cards matching the KPI surface and rounding.
Chart plots reveal their data with a short horizontal sweep.
Reduced-motion preferences disable that effect and sidebar transitions. Project
workload bars use a muted neutral token so they are softer in dark mode.
The library's separate default animation is disabled, so it cannot delay or
double-animate the plotted values, including under reduced motion.
Browser tests build and serve the production bundle on an isolated preview port.
This removes hot reload from test workflows while preserving the open development
preview. Generated reports are also excluded from the development file watcher.

## Matching lifecycle summary — 20 October 2026
Issue lifecycle reuses the Work by category panel, metric and amber track styles.
Status labels sit above counts and proportional bars, with four columns on
desktop and two on mobile. Numbered circles, the check icon, chevrons and vertical
separators are removed. Each status remains a link to the filtered issue register.

## Aligned toolbar and icon rail — 20 October 2026
The header is now one floating toolbar spanning the workspace, with aligned
sidebar, New issue, search, appearance and identity controls. Navigation starts
on the same row as the page heading; the sidebar toggle and navigation icons
share a fixed horizontal center. Collapsing the desktop sidebar retains a 64px
icon rail with named, clickable links and custom tooltips. Expanding restores
labels, with the preference retained across reloads. The mobile drawer remains
independent of the stored desktop state.

Lifecycle tracks now use all issue statuses as their denominator, following the
owner's clarification. Resolved is shown as resolved/all issues, rather than
always filling its bar because it has the largest count. Status counts and
filtered register links are unchanged.

## App header, simpler risk surfaces and discussion — 20 October 2026
The current desktop and mobile header holds the current page title and page
actions in one toolbar. PageHeader renders into that shared toolbar without
duplicating its heading in the main content. The sidebar starts with its own
aligned control row, then New issue and Search rows at stable heights in expanded
and icon-only modes. The account selector uses one full clickable row. Mobile
navigation is a dimmed drawer with Escape, scroll locking and focus containment;
it closes when changing to desktop width. Appearance remains on Settings.

The footer is removed at the owner's request. Critical scores and badges use soft
neutral theme surfaces rather than inverted ink blocks. Matrix cells show only
issue counts, retaining axes, keyboard selection, severity colors and accessible
score descriptions/tooltips. Per-cell entrance animation, repeated scores and
issue labels are removed. The compact/full matrices share this treatment.

Discussion uses readable comment text, compact author/time metadata and a quiet
rounded composer with an accessible send button. Immutable stored comments,
version checks and error feedback retain their existing behavior. No backend
mutation or audit rules changed. Latest browser verification is pending because
automatic approval review could not run after its usage limit was reached;
build, lint, frontend tests and documentation checks are recorded in VALIDATION.md.

## Account spacing correction — 20 October 2026
The shared select trigger's `justify-content: space-between` pushed the account
name away from its avatar. The sidebar account trigger now explicitly aligns
content to the start, keeps a 28px avatar and a 10px gap, and lets the name truncate
within remaining width. The collapsed rail centers only the avatar. Mobile
header buttons now use the same 40px box as drawer header buttons, aligning their
icon centers. Browser verification became available again; the focused checks
passed on desktop and mobile. See VALIDATION.md for the complete-run result.
System appearance is owned by an app-wide provider, so it continues following
system changes when the Settings page and its control are unmounted.

## Shared interactions and settings — 20 October 2026
The toolbar uses the same solid surface as the sidebar. Obsolete header blur
declarations were removed after a production-browser check found an old
unprefixed declaration surviving CSS optimization. Sidebar expansion/collapse is
the first navigation-style row; its icon stays aligned with the other icons.
Desktop and mobile controls have explicit visibility rules.

Hover uses a separate light/dark surface so rows and cards remain distinct from
the page and their status badges. Workflow targets share one button style and
alignment. Checkbox filters share select controls' height, padding and type.
The full risk matrix has square cells, restrained colors and single-pixel issue
dividers. Selection, keyboard use and all issue links remain functional.

Settings now includes comfortable/compact density, system/reduced motion, a
default trend range and background refresh. These preferences persist locally,
validate saved values and apply across routes. Reduced motion disables UI/chart
animation; compact density tightens records; the chart default initializes the
trend views; background refresh controls their existing query polling. Manual
refresh, normal fetching and mutation invalidation remain available.
No domain, audit, workflow or persistence rules changed.

## Flat Activity and dialogs — 20 October 2026
Activity now uses three separate cards with the shared KPI classes and a
separate chart panel. Search fields use the same surface as neutral controls,
including the command-search input. All CSS shadow declarations, panel shadow
tokens and the chart tooltip shadow are disabled. Menus and dialogs use a thin
border for definition. Modal and command-search backdrops are transparent and
have no blur, leaving the underlying page colors intact. Mobile navigation keeps
its separate drawer scrim. Existing dialog focus, Escape, outside interaction and
mutation behavior remain unchanged.

The matrix's full and compact cells now use a subtle 6px corner radius at the
owner's request. The square proportions and shared severity surfaces remain.

Modal and command-search overlays now blur the full viewport by 8px, including
the header and sidebar. They retain transparent backgrounds and no shadows.
