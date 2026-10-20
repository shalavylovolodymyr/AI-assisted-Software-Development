# API contract

Base `/api/v1`; interactive contracts at `/docs`, machine contract `/openapi.json`.
GET `/health` checks PostgreSQL and returns 503 on connection failure.

Reads: `/config`, `/users`, `/projects`, `/projects/{id}`, `/issues`, `/issues/{id}`,
`/actions`, `/activity`, `/dashboard/summary`, `/analytics/risk-matrix`,
`/analytics/risk-distribution`. Issue children: `/risk-assessments`, `/actions`,
`/comments`, `/activity`.

Writes: POST `/issues`; PATCH `/issues/{id}`; POST `/issues/{id}/transitions`,
`/issues/{id}/risk-assessments`, `/issues/{id}/actions`, `/issues/{id}/comments`;
PATCH `/actions/{id}`; DELETE `/issues/{id}` and `/actions/{id}`; POST
`/issues/{id}/restore` and `/actions/{id}/restore`. Deletion/restoration accepts
`expected_version`. There are no assessment/comment update or delete routes.

Every write requires `X-Demo-User: <known fictional user UUID>`. Identity is not secure
authentication. `DEMO_MODE=false` rejects writes. MEMBER action updates require ownership;
MANAGER and ADMIN may update any action. Issue deletion/restoration permits
ADMIN/MANAGER and the reporting/assigned MEMBER. Action deletion/restoration
permits ADMIN/MANAGER and the owning MEMBER, only for unfinished actions on a
current OPEN/IN_PROGRESS issue. Other local demo workflow actors are equal.

The welcome screen requires explicit user selection and Log in. The frontend
stores `signal-session-user` and uses it for `X-Demo-User`; logout removes it.
This introduces no API authentication endpoints or server-side read restriction.
`GET /config` advertises `deletion: true` on the updated API. Its CORS policy
includes DELETE for the configured frontend origins.

Creation fields: project_id, title, description, category, priority, assignee_id,
optional due_date, likelihood, impact and rationale. Reporter and assessor come from
the selected actor. Incoming fields are bounded and unknown fields are rejected.
Risk inputs require strict integers, including rejection of booleans and numeric strings.

Subsequent mutations include `expected_version` from the issue detail. Actions return
their parent issue version in collection/detail reads. Every successful mutation
increments the parent issue version. A stale request returns 409 with refresh guidance.

Issue lists accept `search`, `status`, `severity`, `project_id`, `assignee_id`, `active_only`,
`sort` (updated_at, created_at, title, risk_score, due_date, reference_code),
`direction` (asc/desc), `page` (1+) and `page_size` (1–100, default 10).
Response: items, total, page, page_size. Activity uses the same page envelope.
Issue/action lists accept `deleted=true` for recoverable records; default reads
exclude deleted work. Removed issues remain readable by ID with history intact,
but reject workflow writes until restored. Action filters: status and owner_id.
Matrix/distribution exclude RESOLVED and deleted issues.
Date-only due dates use ISO 8601. UTC timestamps include their offset.

HTTP: 200 reads/updates/transitions; 201 creation, assessment, action and comment;
403 missing/disallowed demo identity; 404 missing record; 409 workflow/conflict;
422 invalid input. Errors return `{code, message}`; validation also includes
field/message entries. Unexpected errors are logged server-side with a generic client message.

## Analytics and history filters
`GET /analytics/trends?days=90` accepts 7–365 days. It returns daily UTC snapshots,
range metrics, active categories, action status counts and total recorded events.
Null average risk/duration means no relevant evidence, not zero. Resolutions count
recorded resolution events, including later resolutions after reopening. Mean
resolution days measures creation to each resolution recorded in the range.

`GET /activity` also accepts `search` (title/reference/actor), `event_type` and
`project_id`. Filters apply before `page`/`page_size`; page size remains 1–100.
