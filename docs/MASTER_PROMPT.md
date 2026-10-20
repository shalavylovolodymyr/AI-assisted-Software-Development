# CODEX MASTER PROMPT: BUILD SIGNAL

## 0. Your mission

You are an autonomous senior software engineering team operating as:

- Principal Software Architect
- Senior Python Backend Engineer
- Senior React Frontend Engineer
- Product Designer specializing in premium enterprise SaaS
- Test Automation Engineer
- DevOps / CI/CD Engineer
- Technical Documentation Lead
- Security and Quality Reviewer

Build a complete, working, visually exceptional enterprise full-stack application called **SIGNAL**.

**Product name:** SIGNAL  
**Tagline:** From risk to resolution.  
**Category:** Enterprise Issue, Risk & Action Management  
**Purpose:** FHNW AI-assisted Software Development Capstone Project, Autumn 2026  
**Deadline:** 29 October 2026

This is not a request for a plan, mockup, scaffold, or prototype. Implement the actual application, database, backend, frontend, tests, developer tooling, CI/CD configuration, and documentation.

The final repository must be ready for me to review, run locally, demonstrate live, and manually publish to GitHub.

Do not push code to GitHub, deploy externally, create cloud resources, purchase services, or use paid APIs without explicit permission.

Work autonomously within the local project. Make reasonable technical decisions without repeatedly asking questions. Document consequential assumptions and decisions. Ask for approval only where required for external actions, destructive operations, security-sensitive decisions, or material scope changes.

Prioritize, in order:

1. A complete and reliable end-to-end application.
2. Demonstrable compliance with all capstone requirements.
3. Correct Clean Architecture and business logic.
4. Real TDD and automated testing.
5. A polished, memorable interface.
6. Reproducible local setup and CI/CD.
7. Concise, credible documentation and presentation materials.

Never sacrifice correctness to add visual effects or unnecessary features.

---

# 1. Academic assessment requirements

This project must satisfy the following requirements.

## Architecture

- Clean Enterprise-grade architecture.
- Explicit Domain, Application, Interfaces, and Infrastructure layers.
- Business logic separated from framework-specific code.
- Domain entities and application services independently testable.
- Repository interfaces and dependency inversion.
- Spec-Driven Development.
- Root AGENTS.md and appropriate AI-SDLC artifacts.
- Documented architectural decisions.

## Domain

- At least five meaningful domain entities.
- At least two genuine application use cases implemented as services.
- Relational database.
- ORM integration.
- Meaningful business rules, not merely CRUD endpoints.

## Engineering

- Test-Driven Development, Red–Green–Refactor.
- Unit tests.
- Integration tests.
- End-to-end tests.
- CI/CD principles.
- Active use of Codex as a coding agent.
- Reproducible environment.
- Documented validation evidence.

## Submission

- Complete source code.
- GitHub-ready repository.
- Concise README.md.
- Demonstrable application.
- Presentation explaining architecture, development decisions, coding-agent usage, testing, and learning outcomes.

Treat the academic requirements as hard acceptance criteria.

Use these references where available:

- https://github.com/AIaSDev/BAIssue
- https://github.com/AIaSDev/ai-sdlc-template
- https://docs.aisl.science/learning-and-resources/ai-sdlc

Inspect the references before making architectural decisions. Use BAIssue as a reference, not as code to copy blindly. Preserve any existing AI-SDLC template artifacts where practical and adapt them correctly.

If reference material cannot be accessed, proceed using the requirements in this prompt and explicitly document that limitation.

---

# 2. Product concept

## 2.1 The problem

Organizations frequently manage operational issues, risks, and corrective actions across disconnected spreadsheets, emails, and task lists.

This makes it difficult to answer:

- What issues currently require attention?
- Which risks are most critical?
- Who is accountable?
- What corrective actions are underway?
- Are those actions actually reducing risk?
- Which issues are overdue?
- What changed, when, and by whom?

SIGNAL provides one coherent workspace to manage this lifecycle.

## 2.2 Core value proposition

**Detect → Assess → Assign → Mitigate → Resolve**

An organization can:

1. Register an operational issue.
2. Evaluate its risk using impact and likelihood.
3. Automatically calculate its risk score and severity.
4. Assign ownership.
5. Create and track mitigation actions.
6. Review the risk after mitigation.
7. Resolve the issue when the defined conditions are met.
8. Examine an audit trail of important changes.

This must be a functioning workflow backed by persistent relational data.

## 2.3 Product boundaries

Build a focused enterprise application, not a giant ERP system.

In scope:

- Dashboard
- Issue management
- Risk assessment
- Mitigation action tracking
- Team / owner directory
- Activity history
- Risk analytics
- Demo data
- API documentation

Out of scope:

- External enterprise integrations
- Email delivery
- Complex organization-wide RBAC
- Billing
- AI-generated risk assessments
- External LLM inference
- File uploads
- Real-time multiuser collaboration
- Multi-tenant SaaS infrastructure

AI is used to develop the software. The application itself does not need to call an LLM.

This distinction is important. The module assesses AI-assisted software engineering, not necessarily AI-powered product features.

---

# 3. Technical architecture

## 3.1 Required technology stack

Use the following stack unless repository inspection identifies a compelling compatibility issue.

### Backend

- Python 3.12+
- FastAPI
- SQLAlchemy 2.x
- Pydantic 2
- Alembic
- PostgreSQL
- pytest
- pytest-cov
- Ruff
- HTTPX

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components where appropriate
- Lucide icons
- Recharts
- TanStack Query
- React Router
- React Hook Form
- Zod
- Vitest
- React Testing Library
- Playwright

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- Environment variables
- Health checks
- Database migrations

Prefer stable, mutually compatible dependency versions. Use lockfiles and pin important dependencies.

Do not add Redis, Kafka, Kubernetes, microservices, or other infrastructure without a genuine requirement.

## 3.2 Architectural style

Use a **modular monolith with Clean Architecture**.

Expected backend structure:

```text
backend/
  src/
    signal_app/
      domain/
        entities/
        enums/
        exceptions/
        services/
        value_objects/
      application/
        dto/
        ports/
        use_cases/
      interfaces/
        api/
          routes/
          schemas/
          dependencies/
      infrastructure/
        database/
          models/
          repositories/
          migrations/
        configuration/
        security/
      main.py
  tests/
    unit/
    integration/
    api/
  pyproject.toml
  Dockerfile
```

Adjust naming if needed, but preserve the boundaries.

Dependency direction:

```text
Interfaces → Application → Domain
Infrastructure → Application / Domain
```

The Domain layer must not import FastAPI, SQLAlchemy, or framework-specific modules.

Application services must depend on abstractions rather than concrete SQLAlchemy repositories.

Infrastructure implements persistence interfaces.

API routes should remain thin.

The backend must enforce all business rules. The frontend must not be the authoritative source for validation, scoring, or workflow transitions.

Use dependency injection at the application boundary.

---

# 4. Domain model

Implement the following seven domain entities.

## Entity 1: User

Represents a team member.

Fields:

- id: UUID
- full_name
- email: unique
- role: ADMIN / MANAGER / MEMBER
- avatar_color
- created_at

For the capstone, use a clearly labeled demo-user selection mechanism rather than pretending to implement secure enterprise authentication.

All users are fictional.

Document that demo identity switching is not production authentication.

## Entity 2: Project

Represents a business initiative or operational area.

Fields:

- id: UUID
- name
- code: unique
- description
- status: ACTIVE / ARCHIVED
- owner_id
- created_at

Example projects:

- Digital Operations
- Customer Experience
- Infrastructure Modernization
- Regulatory Readiness

## Entity 3: Issue

Represents a business issue requiring investigation or action.

Fields:

- id: UUID
- reference_code: unique, human-readable
- project_id
- title
- description
- category
- priority
- status
- reporter_id
- assignee_id
- due_date
- created_at
- updated_at
- resolved_at

Statuses:

- OPEN
- IN_PROGRESS
- MITIGATED
- RESOLVED

Categories:

- SECURITY
- OPERATIONS
- COMPLIANCE
- TECHNOLOGY
- CUSTOMER
- OTHER

Priorities:

- LOW
- MEDIUM
- HIGH
- CRITICAL

## Entity 4: RiskAssessment

Represents a risk evaluation of an issue.

Fields:

- id: UUID
- issue_id
- likelihood: integer 1–5
- impact: integer 1–5
- score: integer 1–25
- severity
- rationale
- assessed_by
- assessed_at

Risk assessments must be immutable historical records.

An issue may have multiple assessments over time.

The most recent assessment is its current risk assessment.

Do not overwrite historical assessments.

## Entity 5: MitigationAction

Represents a corrective action associated with an issue.

Fields:

- id: UUID
- issue_id
- title
- description
- owner_id
- status
- due_date
- completed_at
- created_at

Statuses:

- TODO
- IN_PROGRESS
- DONE
- CANCELLED

## Entity 6: Comment

Represents a discussion entry on an issue.

Fields:

- id: UUID
- issue_id
- author_id
- body
- created_at

Comments are immutable in the MVP.

## Entity 7: AuditEvent

Represents a significant business change.

Fields:

- id: UUID
- issue_id
- actor_id
- event_type
- previous_value
- new_value
- occurred_at

Store structured change data as JSON where appropriate.

Use UTC timestamps in storage and format them in the user's locale in the frontend.

Use proper foreign keys, indexes, uniqueness constraints, and migration scripts.

Do not store derived dashboard metrics redundantly.

---

# 5. Business rules

Business rules must be explicitly implemented and tested.

## 5.1 Risk scoring

Use a transparent 5×5 risk matrix.

Formula:

```text
Risk Score = Likelihood × Impact
```

Both values must be integers between 1 and 5 inclusive.

Severity thresholds:

| Score | Severity |
|---|---|
| 1–4 | LOW |
| 5–9 | MODERATE |
| 10–16 | HIGH |
| 17–25 | CRITICAL |

Use a pure domain function for risk scoring.

Example:

```text
Likelihood: 4
Impact: 5
Score: 20
Severity: CRITICAL
```

The calculation must never depend on frontend state or an external API.

Reject invalid values.

## 5.2 Issue workflow

Allowed transitions:

```text
OPEN → IN_PROGRESS
IN_PROGRESS → MITIGATED
MITIGATED → RESOLVED
IN_PROGRESS → OPEN
MITIGATED → IN_PROGRESS
RESOLVED → IN_PROGRESS
```

Reject all other transitions.

Additional constraints:

- An issue cannot become MITIGATED unless it has at least one mitigation action.
- An issue cannot become MITIGATED while any non-cancelled action remains incomplete.
- An issue cannot become RESOLVED unless its current status is MITIGATED.
- An issue cannot become RESOLVED without a risk reassessment recorded after the final required mitigation action was completed.
- A RESOLVED issue may be reopened to IN_PROGRESS.
- Reopening clears resolved_at.
- The issue history must preserve all previous assessments and actions.

These rules must be enforced in the backend application services.

## 5.3 Auditability

Create audit events for:

- Issue creation
- Assignment changes
- Status changes
- Risk assessments
- Mitigation action completion
- Issue reopening

Persist the business change and its audit event within the same database transaction.

Do not create an audit event if the business operation fails.

## 5.4 Concurrency and consistency

- Use transactional application services.
- Enforce relational integrity.
- Prevent duplicate reference codes.
- Prevent accidental duplicate state transitions.
- Return clear errors for invalid transitions.
- Handle missing entities.
- Validate all incoming data.
- Avoid silent data loss.

Use database transactions to protect multi-step workflows.

---

# 6. Application use cases

Implement at least these four genuine application services.

## UC-001: Create and assess an issue

Input:

- Project
- Title
- Description
- Category
- Priority
- Reporter
- Assignee
- Initial likelihood
- Initial impact
- Risk rationale

Behavior:

1. Validate input.
2. Validate referenced entities.
3. Create issue.
4. Calculate initial risk.
5. Create risk assessment.
6. Create audit event.
7. Persist atomically.
8. Return the created issue and risk information.

Acceptance criteria:

- A valid request creates all required records.
- Invalid risk values are rejected.
- Missing projects or users are rejected.
- The risk score is correct.
- Failed transactions leave no partial records.

## UC-002: Plan and complete mitigation

Input:

- Issue ID
- Action details
- Owner
- Due date

Behavior:

1. Retrieve issue.
2. Validate issue state.
3. Create mitigation action.
4. Assign owner.
5. Persist action.
6. Allow owner to update action status.
7. Record completion time when marked DONE.
8. Write audit event.

Acceptance criteria:

- An issue can have multiple actions.
- Actions persist after refresh.
- Completion updates the dashboard.
- Invalid action transitions are rejected.
- Cancellation is handled consistently.

## UC-003: Reassess risk

Input:

- Issue ID
- New likelihood
- New impact
- Rationale
- Assessor

Behavior:

1. Validate issue.
2. Calculate new score.
3. Create new assessment.
4. Preserve previous assessments.
5. Record audit event.
6. Return risk trend.

Acceptance criteria:

- Historical assessments remain unchanged.
- Current risk reflects the newest assessment.
- Risk history is chronologically ordered.
- The risk matrix reflects the current assessment.

## UC-004: Resolve an issue

Input:

- Issue ID
- Acting user

Behavior:

1. Retrieve issue and associated actions.
2. Validate workflow transition.
3. Check completion conditions.
4. Check that reassessment occurred after final required mitigation completion.
5. Mark issue RESOLVED.
6. Set resolved_at.
7. Create audit event.
8. Persist atomically.

Acceptance criteria:

- Resolution succeeds when all rules are satisfied.
- Resolution fails when required actions are incomplete.
- Resolution fails when reassessment is missing or outdated.
- Failure returns a meaningful domain error.
- The audit trail is correct.

---

# 7. Frontend product design

The visual quality of this application is a major priority.

Create an original, premium, dark enterprise SaaS interface.

It should feel like a serious software product that could be sold to organizations, not a classroom exercise or generic admin template.

## 7.1 Visual identity

Brand:

**SIGNAL**

Tagline:

**From risk to resolution.**

Style:

- Minimalist
- Modern
- Premium
- Precise
- Data-dense but readable
- Elegant
- Professional
- Distinctive

Color system:

```text
Main background: #0B0D12
Sidebar: #10131A
Surface: #151922
Elevated surface: #1B202B
Border: #2A303C
Primary text: #F5F7FB
Secondary text: #929BAC
Primary accent: #A78BFA
Accent hover: #C4B5FD
Success: #34D399
Warning: #FBBF24
Danger: #FB7185
```

Use colors consistently as design tokens.

Typography:

- Inter or Geist
- Strong typography hierarchy
- Clear numeric displays
- Compact data tables
- Legible labels

Use Lucide icons consistently.

Do not use emojis as interface icons.

Use subtle animation only where it improves comprehension.

No unnecessary gradients, excessive shadows, neon effects, or distracting motion.

Use accessible contrast and keyboard focus indicators.

## 7.2 Overall layout

Desktop:

- Persistent left sidebar
- Main content area
- Compact top header
- Breadcrumb / page title
- User selector
- Search / filters where relevant

Sidebar navigation:

```text
SIGNAL

WORKSPACE
  Overview
  Issues
  Risk Matrix
  Actions
  Projects

SYSTEM
  Activity
  About
```

Responsive behavior:

- Desktop sidebar
- Tablet collapsible navigation
- Mobile drawer
- No horizontal page overflow
- Responsive tables
- Mobile-friendly forms
- Touch-friendly controls

The desktop experience should be optimized for a projector and live presentation.

## 7.3 Overview dashboard

This is the visual centerpiece.

Header:

```text
Operational overview

Understand your risk exposure.
```

Include four prominent KPI cards:

1. Active issues
2. Critical risks
3. Overdue actions
4. Resolved issues

Below the KPI cards:

- Risk distribution chart
- Issues by status
- Recent activity
- Critical issues table
- Mitigation progress
- Compact 5×5 risk matrix preview

Use genuine database-derived values.

Do not hardcode statistics.

Charts must update after relevant mutations.

Show loading, empty, and error states.

## 7.4 Issues page

Create a sophisticated data table.

Columns:

- Issue reference
- Title
- Project
- Priority
- Status
- Risk score
- Assignee
- Due date

Features:

- Search
- Status filter
- Severity filter
- Project filter
- Sorting
- Pagination
- Create issue button
- Clickable rows

Use clear status badges.

Risk scores should be visually distinguishable.

Include useful empty states.

## 7.5 Issue detail page

Create a detailed issue workspace.

Layout:

Main column:

- Issue title
- Description
- Status
- Risk assessment card
- Mitigation actions
- Comments
- Activity timeline

Right column:

- Project
- Priority
- Assignee
- Reporter
- Due date
- Created date
- Current risk score

Include:

- Edit issue
- Assign owner
- Add mitigation action
- Assess risk
- Change status
- Add comment

The UI must enforce valid user flows, while the backend remains authoritative.

Show meaningful error messages if the backend rejects an operation.

## 7.6 Risk Matrix page

This is the most important stage demonstration feature.

Build a beautiful, interactive 5×5 risk matrix.

Axes:

```text
Y-axis: Impact (1–5)
X-axis: Likelihood (1–5)
```

Each cell represents the calculated severity.

Use a professional color scale:

- Low: muted green
- Moderate: amber
- High: orange
- Critical: red

Requirements:

- Each cell shows the number of current issues in that category.
- Hover reveals details.
- Clicking a cell filters or displays matching issues.
- Selected cell has a clear visual state.
- Risk assessment changes update the matrix.
- Empty cells remain visible.
- Tooltips and legends are understandable.

Use a matrix, not a generic heatmap library that obscures the scoring rules.

Add a side panel showing the selected issues.

This page must be visually memorable and fully functional.

## 7.7 Mitigation Actions page

Show corrective actions across all issues.

Include:

- Action title
- Related issue
- Owner
- Status
- Due date
- Overdue indicator

Allow users to:

- Filter by status
- Filter by owner
- View related issue
- Update action status

Use an attractive table or compact board layout.

Prefer whichever produces the most reliable and understandable workflow.

## 7.8 Projects page

Show project cards with:

- Name
- Description
- Owner
- Number of active issues
- Number of critical risks
- Mitigation progress

Clicking a project filters its issues.

## 7.9 Activity page

Display a chronological activity feed.

Examples:

```text
09:42  Emma Wilson reassessed SIG-014
       Risk changed from 20 to 8

09:31  Daniel Reed completed a mitigation action
       Access control review

Yesterday  Sophia Chen resolved SIG-009
```

Use real persisted audit events.

Never display fabricated activity after initial demo seeding.

---

# 8. User experience requirements

Implement complete interactions.

No decorative buttons that do nothing.

No placeholder navigation.

No fake backend calls.

No hardcoded success notifications.

Every implemented interaction must either work or clearly indicate that the feature is unavailable.

Requirements:

- Functional create forms
- Functional edit forms
- Form validation
- Confirmation dialogs for consequential actions
- Toast notifications
- Loading states
- Error handling
- Empty states
- Keyboard navigation
- Responsive layout
- Proper date formatting
- Accessible form labels
- Meaningful tooltips
- Clear success feedback
- Consistent spacing

Use optimistic updates only where rollback is reliable. Otherwise, use mutation completion and query invalidation.

Prefer correct behavior over sophisticated animations.

---

# 9. Database and persistence

Use PostgreSQL as the primary relational database.

Use SQLAlchemy ORM.

Create Alembic migrations.

Required relationships:

```text
User 1 → many Issues (reporter)
User 1 → many Issues (assignee)

Project 1 → many Issues

Issue 1 → many RiskAssessments
Issue 1 → many MitigationActions
Issue 1 → many Comments
Issue 1 → many AuditEvents

User 1 → many MitigationActions
User 1 → many Comments
```

Implement:

- Foreign keys
- Appropriate indexes
- Unique constraints
- NOT NULL constraints
- Proper delete policies
- Transaction handling
- Database session lifecycle management

Use UUID primary keys.

Use UTC timestamps.

Create database migrations that work on a fresh installation.

Avoid `create_all()` as a substitute for production migrations.

---

# 10. API design

Expose a versioned REST API.

Base path:

```text
/api/v1
```

Suggested endpoints:

```text
GET    /health

GET    /api/v1/dashboard/summary

GET    /api/v1/projects
GET    /api/v1/projects/{id}

GET    /api/v1/users

GET    /api/v1/issues
POST   /api/v1/issues
GET    /api/v1/issues/{id}
PATCH  /api/v1/issues/{id}
POST   /api/v1/issues/{id}/transitions

GET    /api/v1/issues/{id}/risk-assessments
POST   /api/v1/issues/{id}/risk-assessments

GET    /api/v1/issues/{id}/actions
POST   /api/v1/issues/{id}/actions
PATCH  /api/v1/actions/{id}

GET    /api/v1/actions

GET    /api/v1/issues/{id}/comments
POST   /api/v1/issues/{id}/comments

GET    /api/v1/issues/{id}/activity
GET    /api/v1/activity

GET    /api/v1/analytics/risk-matrix
GET    /api/v1/analytics/risk-distribution
```

Use consistent:

- Request schemas
- Response schemas
- HTTP status codes
- Error messages
- Pagination
- Filtering
- Sorting
- Validation

Use FastAPI-generated OpenAPI documentation.

Do not expose ORM objects directly as API contracts.

Do not expose stack traces to frontend users.

---

# 11. Test-Driven Development

TDD is a central academic requirement.

Implement real Red–Green–Refactor cycles.

For each major use case:

1. Define acceptance criteria.
2. Write failing tests.
3. Run them and record the failure.
4. Implement the minimum necessary code.
5. Run tests again.
6. Refactor without changing behavior.
7. Run the complete relevant test suite.
8. Record verification evidence.

Do not claim that TDD was followed unless actual test-first evidence exists.

Do not fabricate terminal output, commits, CI results, or test histories.

## 11.1 Unit tests

Test domain behavior without database or web framework dependencies.

Required tests:

- Risk score calculation
- Risk severity thresholds
- Invalid risk values
- Allowed workflow transitions
- Invalid workflow transitions
- Mitigation completion rules
- Resolution eligibility
- Reopening behavior
- Historical risk preservation
- Due-date and overdue calculations

Test boundary values carefully.

Examples:

```text
1 × 1 = 1 → LOW
2 × 2 = 4 → LOW
1 × 5 = 5 → MODERATE
3 × 3 = 9 → MODERATE
2 × 5 = 10 → HIGH
4 × 4 = 16 → HIGH
5 × 4 = 20 → CRITICAL
5 × 5 = 25 → CRITICAL
```

## 11.2 Integration tests

Use an isolated PostgreSQL test database.

Test:

- Repository persistence
- Foreign key relationships
- Transaction rollback
- Risk assessment history
- Audit event persistence
- Dashboard aggregation
- Migrations
- Issue creation with assessment
- Action completion
- Resolution workflow

Use fixtures and isolated test data.

Do not run destructive tests against the development database.

## 11.3 API tests

Test:

- Valid creation requests
- Invalid payloads
- Missing entities
- Pagination
- Filtering
- Error codes
- Workflow transitions
- Risk assessment endpoints
- Dashboard values

## 11.4 Frontend tests

Use Vitest and React Testing Library.

Test:

- Risk score rendering
- Form validation
- Filters
- Loading states
- Error states
- Status badges
- Mutation feedback

## 11.5 End-to-end tests

Use Playwright.

Test at least these workflows:

**E2E-001: Create issue**

Create a new issue through the UI and verify it appears in the issue list and database-backed detail view.

**E2E-002: Assess risk**

Create or reassess risk and verify the risk matrix updates.

**E2E-003: Mitigate and resolve**

Create an issue, assign mitigation actions, complete them, reassess risk, and resolve the issue.

**E2E-004: Invalid resolution**

Attempt to resolve an issue with incomplete mitigation actions and verify that the operation is blocked with a meaningful message.

## 11.6 Quality targets

Aim for:

- 90%+ coverage of Domain and Application layers.
- Passing backend unit tests.
- Passing backend integration tests.
- Passing frontend tests.
- Passing critical E2E tests.
- No TypeScript errors.
- No Ruff errors.
- Successful production frontend build.

Coverage is a target, not a reason to write meaningless tests.

---

# 12. CI/CD

Implement GitHub Actions workflows.

## Continuous Integration

On push and pull request:

1. Install dependencies.
2. Run backend lint checks.
3. Run backend unit tests.
4. Run integration tests with PostgreSQL service.
5. Run frontend lint checks.
6. Run TypeScript type checking.
7. Run frontend tests.
8. Build frontend.
9. Validate relevant AI-SDLC artifacts.
10. Publish test summaries or coverage artifacts where practical.

Configure caching where useful.

Keep the workflow reproducible.

Use least-privilege GitHub Actions permissions.

Pin third-party actions to immutable revisions where practical.

Do not require paid services.

## Continuous Delivery

Provide a reproducible Docker build.

The application must run locally with:

```bash
docker compose up --build
```

Use a clear, documented startup process.

Ensure database migrations execute reliably before API startup.

Use health checks and service dependencies appropriately.

A green CI build does not mean the application was deployed.

Do not claim deployment unless it actually happened.

Production deployment is optional and requires explicit approval.

---

# 13. AI-SDLC and agent documentation

Follow the FHNW AI-SDLC methodology.

Required lifecycle:

```text
0 BOOTSTRAP
1 SPECIFY
2 DESIGN
3 DEVELOP
4 VALIDATE
5 DEPLOY
```

Read and preserve the repository's existing AGENTS.md and relevant skills when present.

Create or adapt:

```text
AGENTS.md

docs/
  PROJECT.md
  TASKS.md
  ARCHITECTURE.md
  TDD.md
  AI_USAGE.md
  DEMO.md
  specs/
    UC-001.md
    UC-002.md
    UC-003.md
    UC-004.md
  adr/
    ADR-001.md
    ADR-002.md
    ADR-003.md
```

Use the existing template structure when it differs.

Keep AGENTS.md concise.

Use progressive disclosure by linking specialized documents.

## 13.1 Project documentation

PROJECT.md should describe:

- Product objective
- Target users
- Scope
- Out-of-scope features
- Technology stack
- Architecture
- Main use cases
- Run commands
- Test commands
- Major dependencies

## 13.2 Use-case specifications

Each specification must include:

- Business objective
- Actors
- Preconditions
- Inputs
- Main flow
- Alternative flows
- Errors
- Postconditions
- Acceptance criteria
- Test cases

## 13.3 Architecture decisions

Document consequential decisions such as:

- Modular monolith instead of microservices
- FastAPI and SQLAlchemy
- PostgreSQL
- Demo-user selection instead of authentication
- Derived risk scoring and immutable assessments

Record decision status honestly.

Do not mark a human-approval-gated decision as formally accepted without human approval.

## 13.4 AI usage documentation

Create docs/AI_USAGE.md.

Document:

- Coding agent used: OpenAI Codex
- Scope of agent responsibilities
- Human decisions
- Architecture decisions
- Testing strategy
- Review process
- Limitations
- Lessons learned

Use actual development evidence.

Do not invent agent conversations or human reviews.

Record the relevant prompt and implementation milestones.

---

# 14. Demo data

The application must be impressive immediately after setup.

Create a deterministic demo seed command.

Use fictional companies, projects, and users.

Create approximately:

- 6 users
- 4 projects
- 24 issues
- 35–45 risk assessments
- 35–50 mitigation actions
- 20 comments
- Appropriate audit events

The exact counts may vary if required by consistent business rules.

Create varied scenarios:

- Critical unresolved issue
- High-risk operational issue
- Several moderate risks
- Low-risk resolved issue
- Overdue actions
- Fully mitigated issue awaiting reassessment
- Issue with improving risk trend
- Issue with worsening risk trend

Ensure seeded records obey all domain invariants.

Use stable, deterministic identifiers or an idempotent seeding strategy.

Running the seed command twice must not duplicate records.

Do not generate random data that changes on every startup.

All demo dashboard statistics must be derived from the seeded database.

Provide a reset procedure for demo data that is clearly labeled as destructive and requires confirmation.

---

# 15. Presentation mode

The application will be demonstrated to university lecturers.

Make the experience stage-ready.

Create a small "Demo" indicator in the interface when running with demo configuration.

Provide a reproducible walkthrough in docs/DEMO.md.

The demonstration should take approximately five minutes.

Suggested flow:

**Scene 1: Overview**

Open the dashboard.

Show active issues, critical risks, overdue actions, and portfolio distribution.

**Scene 2: Risk matrix**

Open the interactive matrix.

Select a critical-risk cell.

Show the related issues.

**Scene 3: Create an issue**

Create a new issue with likelihood 5 and impact 4.

Show that the calculated score is 20 and severity is CRITICAL.

Show the dashboard and matrix updating.

**Scene 4: Mitigation**

Create a mitigation action.

Assign an owner.

Complete the action.

**Scene 5: Risk reduction**

Reassess the issue with likelihood 2 and impact 2.

Show the score changing from 20 to 4.

Show the assessment history.

**Scene 6: Resolution**

Transition through the valid workflow and resolve the issue.

Show the audit timeline.

**Scene 7: Engineering evidence**

Show:

- Clean Architecture diagram
- Passing automated tests
- GitHub Actions configuration
- API documentation
- AGENTS.md and use-case specifications

The demo must use real application behavior, not screenshots masquerading as functionality.

Create a short fallback demonstration guide for situations where a live demo cannot run.

---

# 16. README requirements

Create a professional, concise README.md.

Structure:

```text
# SIGNAL

From risk to resolution.

## Overview
## Key Features
## Technology Stack
## Architecture
## Domain Model
## Getting Started
## Running Tests
## API Documentation
## AI-Assisted Development
## CI/CD
## Demo
## Project Structure
## Limitations
```

Include:

- Short project description
- Main features
- Technology stack
- Architecture diagram using Mermaid
- Entity relationship diagram using Mermaid
- Local setup instructions
- Docker Compose instructions
- Test commands
- Demo instructions
- GitHub Actions explanation
- AI-SDLC documentation links
- Known limitations

Use actual commands that have been verified.

Do not add broken badges or fabricated test coverage numbers.

Include screenshots only if genuine screenshots can be captured from the working application.

---

# 17. Implementation sequence

Work in the following order.

## Phase 0: Inspect and bootstrap

- Inspect the current repository.
- Inspect relevant reference repositories and AI-SDLC instructions.
- Identify existing scaffolding.
- Create project documentation.
- Define scope.
- Establish architecture.
- Create the implementation backlog.

Do not overwrite useful template files blindly.

## Phase 1: Domain and tests

- Define entities.
- Define enums.
- Define domain exceptions.
- Implement risk scoring.
- Implement workflow transition rules.
- Write and execute unit tests.

Establish correct business behavior before implementing the UI.

## Phase 2: Persistence and application services

- Implement SQLAlchemy models.
- Create Alembic migrations.
- Implement repository interfaces.
- Implement repository adapters.
- Implement use-case services.
- Add integration tests.

## Phase 3: API

- Implement FastAPI routes.
- Implement request and response schemas.
- Implement dependency injection.
- Implement validation and exception handling.
- Add API tests.

## Phase 4: Frontend foundation

- Configure React, TypeScript, and Vite.
- Configure Tailwind and component primitives.
- Implement design tokens.
- Implement navigation.
- Implement responsive layout.
- Implement API client and query handling.

## Phase 5: Core frontend workflows

- Dashboard
- Issues list
- Issue creation
- Issue detail
- Risk assessments
- Mitigation actions
- Status transitions

Ensure complete end-to-end integration.

## Phase 6: Advanced visualization

- Interactive risk matrix
- Risk distribution
- Activity timeline
- Project overview
- Risk history

Do not build charts before the underlying data contracts work.

## Phase 7: Quality assurance

- Unit tests
- Integration tests
- API tests
- Frontend tests
- E2E tests
- Responsive verification
- Accessibility review
- Error handling
- Data consistency checks

## Phase 8: CI/CD and documentation

- Docker Compose
- GitHub Actions
- README
- Architecture diagrams
- AI usage evidence
- Demo instructions
- Final verification

## Phase 9: Visual refinement

Improve:

- Typography
- Spacing
- Table density
- Chart readability
- Risk matrix appearance
- Responsive behavior
- Loading states
- Empty states
- Animation restraint

Do not introduce regressions during visual refinement.

---

# 18. Autonomous execution rules

You are expected to execute the implementation, not merely explain how to implement it.

Follow these rules:

1. Inspect before modifying.
2. Plan the architecture before coding.
3. Use test-first development for core business behavior.
4. Implement vertical slices.
5. Run relevant tests after each slice.
6. Fix errors before adding unrelated features.
7. Keep documentation synchronized with code.
8. Avoid unnecessary dependencies.
9. Avoid fake functionality.
10. Do not fabricate validation results.
11. Do not commit secrets.
12. Do not modify unrelated files.
13. Do not silently weaken requirements.
14. Do not mark unfinished work as complete.
15. Do not push to GitHub.
16. Do not deploy without approval.
17. Do not delete or overwrite user data without approval.
18. Prefer maintainable code over clever abstractions.
19. Keep the application runnable throughout development.
20. Prioritize complete core workflows over optional polish.

If a command fails, investigate the actual error.

If a dependency is unavailable, choose a reasonable compatible alternative and document the deviation.

If execution time or context becomes constrained, complete the core vertical slice first and record remaining work in docs/TASKS.md.

Use checkpoints so work can continue in a new Codex session without losing project state.

---

# 19. Definition of Done

The project is complete only when all the following conditions are satisfied.

## Functional

- [ ] Application starts successfully.
- [ ] Database connection works.
- [ ] Migrations run.
- [ ] Demo data loads.
- [ ] Dashboard displays real data.
- [ ] Issues can be created.
- [ ] Issues can be viewed and edited.
- [ ] Risk assessments calculate correctly.
- [ ] Risk history is preserved.
- [ ] Mitigation actions can be created and completed.
- [ ] Workflow rules are enforced.
- [ ] Issues can be resolved correctly.
- [ ] Audit events are persisted.
- [ ] Risk matrix is interactive.
- [ ] Filters and navigation work.
- [ ] Data persists after refresh.

## Architectural

- [ ] At least five domain entities.
- [ ] At least two application services.
- [ ] Clean Architecture.
- [ ] Framework-independent domain.
- [ ] Repository interfaces.
- [ ] ORM integration.
- [ ] Relational database.
- [ ] Versioned API.
- [ ] Database migrations.

## Engineering

- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] API tests pass.
- [ ] Frontend tests pass.
- [ ] Critical E2E tests pass.
- [ ] Backend lint passes.
- [ ] TypeScript checks pass.
- [ ] Frontend builds.
- [ ] Docker Compose works.
- [ ] CI workflow is configured.
- [ ] CI results are reported honestly.

## Academic

- [ ] AGENTS.md exists.
- [ ] AI-SDLC artifacts exist.
- [ ] Use-case specifications exist.
- [ ] Architectural decisions are documented.
- [ ] TDD evidence exists.
- [ ] AI usage is documented.
- [ ] README is complete.
- [ ] Demo instructions exist.

## Visual

- [ ] Premium, consistent dark UI.
- [ ] Responsive desktop and mobile layouts.
- [ ] Functional navigation.
- [ ] Consistent components.
- [ ] Readable charts.
- [ ] Interactive risk matrix.
- [ ] Appropriate loading and error states.
- [ ] No placeholder interactions.

Do not mark an item complete unless it has been verified.

---

# 20. Final quality review

Before stopping, review the application from five perspectives.

### Principal architect

- Are the architectural boundaries real?
- Is domain logic independent?
- Are dependencies pointing in the correct direction?
- Is the system unnecessarily complicated?

### Enterprise business analyst

- Are business rules clear?
- Do workflows make sense?
- Are invalid states prevented?
- Are the use cases genuinely useful?

### QA engineer

- Are important edge cases covered?
- Are tests meaningful?
- Are integration tests using the correct database?
- Do end-to-end workflows actually work?

### Product designer

- Is the interface visually coherent?
- Can a new user understand the product?
- Is the risk matrix intuitive?
- Is the application impressive on a projector?

### University evaluator

- Can every capstone requirement be demonstrated?
- Is the architecture explainable?
- Is there evidence of TDD?
- Is there evidence of agent-assisted development?
- Is CI/CD configured and validated?
- Are technical decisions documented?
- Can the application be demonstrated in five minutes?

Fix critical issues found during review.

Do not endlessly redesign already adequate components.

---

# 21. Final deliverables

When implementation is complete, provide:

1. A concise summary of the application.
2. The implemented features.
3. The actual project structure.
4. Exact commands to start the application.
5. Exact commands to run tests.
6. Test results and any failures.
7. CI/CD configuration status.
8. Documentation locations.
9. Known limitations.
10. A five-minute demonstration walkthrough.
11. Exact instructions for publishing the local repository to GitHub manually.

Do not claim that GitHub Actions passed before they have actually run on GitHub.

Do not claim that a deployment occurred unless verified.

Do not claim the project is complete if required functionality is missing.

---

# 22. Start now

Begin by inspecting the repository and the available AI-SDLC guidance.

Then:

1. Bootstrap the project.
2. Define and document the architecture.
3. Implement the domain and tests.
4. Implement persistence and application services.
5. Implement the API.
6. Build the complete frontend.
7. Integrate all workflows.
8. Add the risk matrix.
9. Implement CI/CD.
10. Execute verification.
11. Fix defects.
12. Finalize documentation and demo readiness.

**Build SIGNAL as a complete, credible, visually exceptional enterprise full-stack application.**

The final result must be technically defensible, genuinely functional, and ready to demonstrate.

Proceed with implementation.