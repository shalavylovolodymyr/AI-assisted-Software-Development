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
The minimal interface keeps risk-matrix cells square, hides scroll indicators
without disabling scroll, and removes introductions, slogans and repeated captions.
The dashboard starts with summary counts and data charts; a short entrance
transition respects reduced motion.

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

## Apple-inspired button corners — 20 October 2026
Action buttons use softer corners: 16px on standard actions and 20px on compact,
icon, pagination and page-toolbar actions. Risk-matrix cells retain their own
geometry; this change does not round general panels or data surfaces.

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

## Product analytics and reporting — 20 October 2026
Overview is an operational workspace: current KPIs, planning/review gaps, action
outlook, project health, overdue work, risk exposure, priority issues and recent
activity. Charts owns historical flows, risk/workload trends, mitigation pace and
current portfolio breakdowns by age, risk movement and owner. It no longer
duplicates Overview for admins. All three roles retain Charts access.

`GET /analytics/operations` is a read-only Application query over stored issues,
assessments, actions, users and projects. It excludes future records, buckets
active-issue age and latest-review freshness, compares first/latest risk scores,
and summarizes project/owner workload. Review freshness uses an exact 30-day
window. Awaiting review means a completion lacks a strictly later assessment.
On-time completion uses completed actions across all valid history, including
resolved work; empty denominators remain null. Current snapshot panels are
labeled separately from the selected historical range. Action outlook links
open matching UTC due-date filters. Shared overdue flags exclude resolved issues.

Excel exports use a lazy-loaded, pinned ExcelJS dependency and patched UUID
override. They retain typed dates/numbers, literal text, frozen/filterable headers
and column widths. Overview exports its summary and health snapshot; Charts
exports the selected range and current breakdowns. Registers/history export all
filtered pages; Actions exports the full filtered queue; Projects, matrix,
issue risk history and scoped role homes also have exports. Failures appear at
the export button. Routine mutation/identity success popups are removed.

Dark surfaces use neutral charcoal, with a #181818 page background. Risk/status
labels and counters are pills, and controls share rounded corners. The sidebar
toggle is directly in the same list as New issue, Search and navigation, with
40px rows and uniform 4px gaps. Desktop/mobile icon centers still align with the
page toolbar; the collapsed rail continues to show icons.

Following the next visual references, standard buttons, icon buttons, sidebar
rows, selectors, checkbox filters and search fields share a visible neutral fill
and 20px corners. Hover/selection use a distinct shade. Matrix cells retain their
subtle 6px corners, and compact risk/status/count labels remain pills.

The owner explicitly requested that the running API stay up. The live API already
serves the operational-health endpoint, and the frontend changes are available
through the existing development server. Final server refinements (active-only
overdue flags and the corrected 91+ day label) are validated in the isolated test
API and will load at the next normal API restart. No API process was stopped.

The owner clarified that the rounded, filled treatment must not apply to the
sidebar menu. Navigation and its shortcut rows return to transparent resting
backgrounds and subtle 8px corners, with a background only on hover or selection.
The account row also returns to its transparent background and prior 10px corners.
The 40px rows, 4px spacing, aligned icons and collapse behavior remain intact.
Action buttons, filters and search fields retain their filled 20px treatment.

The owner subsequently requested one button height. `--control-height: 40px`
now sizes action/primary/secondary buttons, compact/pagination/workflow actions,
icon buttons, selectors, checkbox filters, calendar buttons, tabs and comment
submission. Search fields and single-line form fields align with those controls.
Icon-only controls are 40px square, including mobile exports; the sidebar account
control also aligns at 40px. Sidebar rows retain their plain list styling and
existing spacing. Matrix cells keep their data-grid proportions; indicator spans
and multiline text fields retain their content sizing.

Text inputs, multiline form fields and the discussion composer now share the
buttons' `--control-radius: 20px`, including focused text areas. Inner discussion
text padding keeps content clear of the rounded corners. Single-line field
heights remain 40px; multiline fields retain their existing height behavior.
Sidebar/menu appearance is unchanged by this field-only refinement.

The command-search close button now sits beside the input in a shared header
row, separated by 8px, instead of occupying the input's rounded end. Both remain
40px tall; the close action uses the standard filled icon-button appearance.
Search keyboard handling, focus and dismissal behavior remain unchanged.

## Welcome, explicit sessions and visible deletion — 20 October 2026
UC-006 adds an app welcome page with product context, an API-backed user selector
and a Log in button. No password is requested. An explicit local session is required
to render workspace routes; legacy automatic selections do not count as login.
Saved sessions survive reload, invalid users return to welcome, and Log out clears
the actor and all mounted workspace dialogs/navigation. Other open tabs follow
session changes. Appearance/display preferences survive logout. This remains a
fictional demo identity flow, not production authentication or server-side access
control. The existing in-workspace user selector remains available.

Delete is labeled on eligible issue details and unfinished action rows; Issues
and Actions have labeled Deleted toggles with recovery. UC-005 retains its role
rules, expected versions, issue-row locks, atomic audit and immutable history.
DELETE is now allowed by the API's CORS policy.

The live API on port 8000 was still the older version and omitted the deletion
capability flag, hiding every deletion control. Migration `9b6e81f0d523` adds two
nullable deletion timestamps; existing counts remained 531 issues, 1,542 actions,
2,848 assessments, 1,307 comments and 8,804 events, with no records removed.
The original API process remains running. A second API on port 8002 serves the
updated implementation; the existing frontend on 5178 uses an ignored local
`frontend/.env.development.local` override (`API_PROXY`). Vite now accepts this
setting from its mode-specific env files as well as the process environment.
Default startup still targets port 8000. This local override can be removed after
the owner normally restarts the primary API with the current code.

The welcome logo now uses the shared ink/on-ink tokens for its tile and waveform:
charcoal with a white symbol in Light, and a light tile with a dark symbol in Dark.
This makes the mark distinct from the page; the wordmark retains the theme text
color. The welcome-card arrow keeps its quieter neutral surface.

## Phone layout corrections — 20 October 2026
Mobile issue titles and actions occupy separate rows. The actions wrap within
the page, preventing Delete from overflowing and expanding the layout viewport.
Editable search, form, assessment and discussion fields use 16px text before and
after focus to avoid the small-text focus zoom seen on the owner's iPhone.
Viewport zoom settings remain the standard width/device and initial scale.

Mobile navigation uses the dynamic viewport height, safe-area padding, square
menu/account rows and a square scrim. Navigation can scroll at shorter heights
while account/logout controls remain available. Desktop navigation retains its
prior corner treatment. The exposure chart uses proportional radii; mobile
places the full ring above a two-column legend. Counts and filtering are unchanged.

Mobile pagination now places the record count above its controls. Previous and
Next share the available row width equally around the page label, retain the
common 40px height and use 12px text with roomier padding. Issues, Actions and
Activity share this treatment; desktop pagination retains its existing layout.
