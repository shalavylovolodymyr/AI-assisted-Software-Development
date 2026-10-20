"""Idempotent, deterministic fictional portfolio. Never resets existing data."""

from datetime import UTC, datetime, timedelta
from random import Random
from uuid import NAMESPACE_URL, uuid5

from signal_app.domain.entities import (
    AuditEvent,
    Comment,
    Issue,
    MitigationAction,
    Project,
    RiskAssessment,
    User,
)
from signal_app.domain.enums import ActionStatus, Category, IssueStatus, Priority, Role
from signal_app.domain.rules import risk_score
from signal_app.infrastructure.config import DATABASE_URL, DEMO_MODE
from signal_app.infrastructure.database.repository import make_uow

BASE = datetime(2026, 9, 18, 9, 0, tzinfo=UTC)


def identifier(key):
    return uuid5(NAMESPACE_URL, "signal.demo/" + key)


def seed(factory):
    with factory() as uow:
        repo = uow.repo
        if repo.get(User, identifier("user/0")):
            return False
        people = ["Emma Wilson", "Daniel Reed", "Sophia Chen", "Oliver Brooks", "Maya Patel", "Lucas Fischer"]
        colors = ["#A78BFA", "#60A5FA", "#34D399", "#FBBF24", "#FB7185", "#38BDF8"]
        users = [
            User(
                identifier(f"user/{i}"),
                name,
                name.lower().replace(" ", ".") + "@signal.example",
                Role.ADMIN if i == 0 else Role.MANAGER if i < 3 else Role.MEMBER,
                colors[i],
                BASE,
            )
            for i, name in enumerate(people)
        ]
        for user in users:
            repo.add(user)
        names = [
            "Digital Operations",
            "Customer Experience",
            "Infrastructure Modernization",
            "Regulatory Readiness",
        ]
        codes = ["DOP", "CXP", "INF", "REG"]
        descriptions = [
            "Reliable systems. Resilient operations.",
            "Earn customer trust at every touchpoint.",
            "Build the foundations for what comes next.",
            "Turn obligations into operational confidence.",
        ]
        projects = [
            Project(identifier(f"project/{i}"), name, codes[i], descriptions[i], "ACTIVE", users[i].id, BASE)
            for i, name in enumerate(names)
        ]
        for project in projects:
            repo.add(project)
        titles = [
            "Privileged access beyond approved scope",
            "Payment reconciliation delays",
            "Vendor recovery plan not validated",
            "Expired service account credentials",
            "Customer data retention gaps",
            "Peak-hour API response degradation",
            "Disaster recovery evidence incomplete",
            "Support routing inconsistencies",
            "Unencrypted legacy data exports",
            "Unreliable overnight processing",
            "Accessibility review findings",
            "Outdated incident escalation contacts",
            "Third-party dependency exposure",
            "Onboarding verification backlog",
            "Network segmentation exceptions",
            "Missing quarterly policy attestation",
            "Unmonitored production configuration drift",
            "Customer feedback response gaps",
            "Capacity thresholds approaching limits",
            "Duplicate reporting definitions",
            "Unverified backup restoration process",
            "Manual approval bottlenecks",
            "Supplier assurance documentation pending",
            "Inconsistent operational handover",
        ]
        pairs = [
            (5, 5),
            (4, 4),
            (3, 4),
            (2, 2),
            (4, 5),
            (3, 3),
            (4, 3),
            (1, 3),
            (5, 4),
            (2, 4),
            (3, 2),
            (1, 2),
            (4, 5),
            (2, 3),
            (3, 5),
            (2, 1),
            (5, 4),
            (3, 3),
            (2, 5),
            (2, 2),
            (4, 4),
            (2, 2),
            (3, 4),
            (1, 1),
        ]
        for i, title in enumerate(titles):
            created = BASE + timedelta(days=i % 12, hours=i % 4)
            issue_id = identifier(f"issue/{i}")
            actor = users[i % 6]
            status = list(IssueStatus)[i % 4]
            target_pair = pairs[i]
            has_second = i < 18 or status == IssueStatus.RESOLVED
            if status == IssueStatus.MITIGATED and i % 8 == 6:
                has_second = False
            first_pair = (
                (min(5, target_pair[0] + 1), min(5, target_pair[1] + 1)) if has_second else target_pair
            )
            if i == 16:
                first_pair = (3, 3)  # Worsening trend is intentionally visible.
            issue = Issue(
                issue_id,
                f"SIG-{i + 1:03d}",
                projects[i % 4].id,
                title,
                f"{title} has been identified during the operational assurance review. "
                "Coordinate corrective work with the accountable owner, validate the outcome, "
                "and review residual risk before closure.",
                list(Category)[i % 6],
                Priority.CRITICAL
                if target_pair[0] * target_pair[1] >= 17
                else Priority.HIGH
                if i % 3
                else Priority.MEDIUM,
                status,
                actor.id,
                users[(i + 1) % 6].id,
                (BASE + timedelta(days=25 + i)).date(),
                created,
                created + timedelta(days=5),
                created + timedelta(days=5) if status == IssueStatus.RESOLVED else None,
                1,
            )
            repo.add(issue)
            event_index = 0

            def event(kind, new, at, old=None, i=i, issue_id=issue_id, actor=actor):
                nonlocal event_index
                repo.add(
                    AuditEvent(identifier(f"event/{i}/{event_index}"), issue_id, actor.id, kind, old, new, at)
                )
                event_index += 1

            event("ISSUE_CREATED", {"title": title, "status": "OPEN"}, created)

            def assessment(pair, index, at, i=i, issue_id=issue_id, actor=actor, first_pair=first_pair):
                likelihood, impact = pair
                score, severity = risk_score(likelihood, impact)
                rationale = (
                    "Residual exposure reviewed after corrective work."
                    if index
                    else "Initial assessment based on operational impact and observed likelihood."
                )
                repo.add(
                    RiskAssessment(
                        identifier(f"risk/{i}/{index}"),
                        issue_id,
                        likelihood,
                        impact,
                        score,
                        severity,
                        rationale,
                        actor.id,
                        at,
                    )
                )
                previous = {"score": first_pair[0] * first_pair[1]} if index else None
                event(
                    "RISK_ASSESSED",
                    {"score": score, "severity": severity, "likelihood": likelihood, "impact": impact},
                    at,
                    previous,
                )

            assessment(first_pair, 0, created + timedelta(minutes=1))
            for j in range(2):
                done = status in (IssueStatus.MITIGATED, IssueStatus.RESOLVED) or (
                    status == IssueStatus.IN_PROGRESS and j == 0
                )
                ast = ActionStatus.DONE if done else ActionStatus.IN_PROGRESS if j == 0 else ActionStatus.TODO
                action = MitigationAction(
                    identifier(f"action/{i}/{j}"),
                    issue_id,
                    ["Implement corrective controls", "Verify effectiveness and document evidence"][j],
                    "Review scope with the accountable owner and record the verified outcome.",
                    users[(i + j + 1) % 6].id,
                    ast,
                    (BASE + timedelta(days=22 + i + j)).date(),
                    created + timedelta(days=3, hours=j) if done else None,
                    created + timedelta(hours=j + 1),
                )
                repo.add(action)
                event(
                    "ACTION_PLANNED", {"action_id": str(action.id), "title": action.title}, action.created_at
                )
                if done:
                    event(
                        "ACTION_COMPLETED",
                        {"action_id": str(action.id), "title": action.title, "status": "DONE"},
                        action.completed_at,
                    )
            if status != IssueStatus.OPEN:
                event(
                    "STATUS_CHANGED",
                    {"status": "IN_PROGRESS"},
                    created + timedelta(days=1),
                    {"status": "OPEN"},
                )
            if status in (IssueStatus.MITIGATED, IssueStatus.RESOLVED):
                event(
                    "STATUS_CHANGED",
                    {"status": "MITIGATED"},
                    created + timedelta(days=3, hours=2),
                    {"status": "IN_PROGRESS"},
                )
            if has_second:
                assessment(target_pair, 1, created + timedelta(days=4))
            if status == IssueStatus.RESOLVED:
                event("STATUS_CHANGED", {"status": "RESOLVED"}, issue.resolved_at, {"status": "MITIGATED"})
            if i < 20:
                comment = Comment(
                    identifier(f"comment/{i}"),
                    issue_id,
                    actor.id,
                    "Owner confirmed. Evidence and residual risk will be reviewed before closure.",
                    created + timedelta(days=2),
                )
                repo.add(comment)
                event("COMMENT_ADDED", {"comment_id": str(comment.id)}, comment.created_at)
        return True


HISTORY_ANCHOR = datetime(2026, 10, 19, 18, 0, tzinfo=UTC)
HISTORY_TITLES = [
    "Access review exceptions",
    "Reconciliation mismatch",
    "Recovery drill findings",
    "Service account rotation",
    "Retention policy gaps",
    "API latency regression",
    "Backup integrity checks",
    "Escalation routing gaps",
    "Export encryption review",
    "Batch processing delays",
    "Accessibility audit findings",
    "On-call coverage gaps",
    "Dependency vulnerabilities",
    "Customer verification backlog",
    "Network policy exceptions",
    "Policy attestation overdue",
    "Configuration drift",
    "Feedback triage backlog",
    "Capacity alert tuning",
    "Reporting definition conflicts",
    "Restore test failures",
    "Approval queue delays",
    "Supplier evidence gaps",
    "Handover checklist exceptions",
    "Monitoring coverage gaps",
]


def seed_history(factory):
    """Add a rich fictional history without modifying any existing record.

    Stable IDs make reruns and upgrades safe. Each of the 25 active matrix cells
    gets three issues, plus 180 resolved cases spanning more than a full year.
    """
    added = False
    with factory() as uow:
        repo = uow.repo
        users = [repo.get(User, identifier(f"user/{i}")) for i in range(6)]
        projects = [repo.get(Project, identifier(f"project/{i}")) for i in range(4)]
        if not all(users) or not all(projects):
            raise ValueError("Seed the base demo portfolio before adding history.")
        for index in range(255):
            key = f"history/v1/{index}"
            issue_id = identifier(key)
            if repo.get(Issue, issue_id):
                continue
            added = True
            active = index < 75
            cell = index % 25
            pair = (cell % 5 + 1, cell // 5 + 1) if active else (index % 2 + 1, (index // 2) % 3 + 1)
            status = (
                [IssueStatus.OPEN, IssueStatus.IN_PROGRESS, IssueStatus.MITIGATED][index % 3]
                if active
                else IssueStatus.RESOLVED
            )
            created = HISTORY_ANCHOR - timedelta(days=30 + index % 65 if active else 14 + (index - 75) * 2)
            updated = (
                HISTORY_ANCHOR - timedelta(hours=index % 12)
                if active
                else created + timedelta(days=5 + index % 14)
            )
            duration = updated - created
            owner = users[(index + 1) % 6]
            reporter = users[(index + 3) % 6]
            scope = (
                ["Production", "Regional services", "Shared platforms"][index // 25]
                if active
                else created.strftime("%B review")
            )
            title = f"{HISTORY_TITLES[index % 25]} · {scope}"
            score, _ = risk_score(*pair)
            issue = Issue(
                issue_id,
                f"SIG-{1001 + index}",
                projects[index % 4].id,
                title,
                f"{HISTORY_TITLES[index % 25]} identified in {scope.lower()}. "
                "Evidence is linked to the corrective actions.",
                list(Category)[index % 6],
                Priority.CRITICAL if score >= 17 else Priority.HIGH if score >= 10 else Priority.MEDIUM,
                status,
                reporter.id,
                owner.id,
                (HISTORY_ANCHOR + timedelta(days=index % 40 - 12)).date()
                if active
                else (updated + timedelta(days=2)).date(),
                created,
                updated,
                updated if not active else None,
                24,
            )
            repo.add(issue)
            event_index = 0

            def event(
                kind, value, at, previous=None, actor_id=None, key=key, issue_id=issue_id, owner_id=owner.id
            ):
                nonlocal event_index
                repo.add(
                    AuditEvent(
                        identifier(f"{key}/event/{event_index}"),
                        issue_id,
                        actor_id or owner_id,
                        kind,
                        previous,
                        value,
                        at,
                    )
                )
                event_index += 1

            event("ISSUE_CREATED", {"title": title, "status": "OPEN"}, created, actor_id=reporter.id)
            if status != IssueStatus.OPEN:
                event(
                    "STATUS_CHANGED",
                    {"status": "IN_PROGRESS"},
                    created + timedelta(hours=1),
                    {"status": "OPEN"},
                )
            for j, action_title in enumerate(
                ["Validate scope and evidence", "Apply corrective controls", "Verify the outcome"]
            ):
                done = status in (IssueStatus.MITIGATED, IssueStatus.RESOLVED) or (
                    status == IssueStatus.IN_PROGRESS and j < 2
                )
                planned = created + timedelta(hours=2 + j)
                completed = created + duration * (0.60 + j * 0.05) if done else None
                action = MitigationAction(
                    identifier(f"{key}/action/{j}"),
                    issue_id,
                    action_title,
                    f"{action_title} for {HISTORY_TITLES[index % 25].lower()}.",
                    users[(index + j) % 6].id,
                    ActionStatus.DONE
                    if done
                    else ActionStatus.IN_PROGRESS
                    if status == IssueStatus.IN_PROGRESS
                    else ActionStatus.TODO,
                    (created + duration * 0.75 + timedelta(days=j)).date(),
                    completed,
                    planned,
                )
                repo.add(action)
                event("ACTION_PLANNED", {"action_id": str(action.id), "title": action.title}, planned)
                if done:
                    event(
                        "ACTION_COMPLETED",
                        {"action_id": str(action.id), "title": action.title, "status": "DONE"},
                        completed,
                        actor_id=action.owner_id,
                    )
            if status in (IssueStatus.MITIGATED, IssueStatus.RESOLVED):
                event(
                    "STATUS_CHANGED",
                    {"status": "MITIGATED"},
                    created + duration * 0.72,
                    {"status": "IN_PROGRESS"},
                )
            previous = None
            for review in range(6):
                target = (
                    pair
                    if review == 5
                    else (min(5, pair[0] + (5 - review) // 2), min(5, pair[1] + (5 - review) // 2))
                )
                rating, severity = risk_score(*target)
                assessed = created + duration * (0.01 + review * 0.19)
                rationale = [
                    "Initial control review.",
                    "Evidence sample expanded.",
                    "Owner review completed.",
                    "Corrective controls tested.",
                    "Effectiveness checked against the baseline.",
                    "Residual exposure confirmed.",
                ][review]
                repo.add(
                    RiskAssessment(
                        identifier(f"{key}/risk/{review}"),
                        issue_id,
                        *target,
                        rating,
                        severity,
                        rationale,
                        users[(index + review) % 6].id,
                        assessed,
                    )
                )
                event(
                    "RISK_ASSESSED",
                    {"score": rating, "severity": severity, "likelihood": target[0], "impact": target[1]},
                    assessed,
                    {"score": previous} if previous is not None else None,
                )
                previous = rating
            for j, body in enumerate(
                [
                    "Evidence owner confirmed.",
                    "Control samples reviewed with the service team.",
                    "Verification results attached to the action record.",
                ]
            ):
                at = created + duration * (0.15 + j * 0.30)
                comment = Comment(
                    identifier(f"{key}/comment/{j}"), issue_id, users[(index + j) % 6].id, body, at
                )
                repo.add(comment)
                event("COMMENT_ADDED", {"comment_id": str(comment.id)}, at, actor_id=comment.author_id)
            if not active:
                event("STATUS_CHANGED", {"status": "RESOLVED"}, updated, {"status": "MITIGATED"})
    varied_added = seed_variety(factory)
    return added or varied_added


VARIED_SYSTEMS = [
    "European identity gateway",
    "customer onboarding",
    "payments ledger",
    "API edge",
    "regional data warehouse",
    "partner portal",
    "backup cluster",
    "service desk",
    "mobile release pipeline",
    "supplier directory",
    "finance exports",
    "reporting hub",
    "cloud tenancy",
    "batch scheduler",
    "document archive",
    "delivery network",
    "central observability",
    "access broker",
    "contact centre",
    "integration gateway",
]
VARIED_ACTIONS = [
    "Remove unused access grants",
    "Rotate affected credentials",
    "Reconcile exception records",
    "Test the fallback procedure",
    "Update the routing rules",
    "Deploy the validation fix",
    "Review the control sample",
    "Rebuild the affected index",
    "Confirm recovery targets",
    "Patch the dependency",
    "Approve the revised runbook",
    "Trace the missing events",
    "Check retention settings",
    "Test the rollback path",
    "Review supplier evidence",
    "Validate the revised policy",
    "Tune alert thresholds",
    "Verify the production outcome",
]


def seed_variety(factory):
    """Append reproducible, irregular cases; never replace a previous demo record."""
    profiles = Random(20261020).sample(
        [(topic, scope) for topic in HISTORY_TITLES for scope in VARIED_SYSTEMS], 250
    )
    added = False
    with factory() as uow:
        repo = uow.repo
        users = [repo.get(User, identifier(f"user/{i}")) for i in range(6)]
        projects = [repo.get(Project, identifier(f"project/{i}")) for i in range(4)]
        for index, (topic, scope) in enumerate(profiles):
            key = f"history/v2/{index}"
            issue_id = identifier(key)
            if repo.get(Issue, issue_id):
                continue
            added = True
            rng = Random(issue_id.int)
            active = index < 70
            status = (
                rng.choices([IssueStatus.OPEN, IssueStatus.IN_PROGRESS, IssueStatus.MITIGATED], [4, 4, 2])[0]
                if active
                else IssueStatus.RESOLVED
            )
            age = rng.randint(18, 430)
            created = HISTORY_ANCHOR - timedelta(days=age, hours=rng.randrange(24), minutes=rng.randrange(60))
            updated = (
                HISTORY_ANCHOR - timedelta(days=rng.randrange(10), hours=rng.randrange(18))
                if active
                else created + timedelta(days=rng.randint(2, min(70, age - 1)), hours=rng.randrange(16))
            )
            duration = updated - created
            pair = (
                (rng.randint(1, 5), rng.randint(1, 5)) if active else (rng.randint(1, 3), rng.randint(1, 3))
            )
            score, _ = risk_score(*pair)
            owner, reporter = rng.choice(users), rng.choice(users)
            title = f"{topic}: {scope}"
            category = rng.choices(list(Category), [24, 25, 15, 22, 10, 4])[0]
            description = rng.choice(
                [
                    f"The control review identified {topic.lower()} in {scope}. "
                    "Validate the affected records with the service owner.",
                    f"Monitoring flagged {topic.lower()} in {scope}. "
                    "The team is checking scope and operational impact.",
                    f"An assurance sample found {topic.lower()} affecting {scope}. "
                    "Review the exception and verify corrective work.",
                    f"Service owners reported {topic.lower()} in {scope}. "
                    "Record the corrective steps and test the outcome.",
                ]
            )
            repo.add(
                Issue(
                    issue_id,
                    f"SIG-{2001 + index}",
                    rng.choice(projects).id,
                    title,
                    description,
                    category,
                    Priority.CRITICAL
                    if score >= 17
                    else rng.choice([Priority.HIGH, Priority.MEDIUM, Priority.LOW]),
                    status,
                    reporter.id,
                    owner.id,
                    (HISTORY_ANCHOR + timedelta(days=rng.randint(-28, 45))).date()
                    if active
                    else (updated + timedelta(days=3)).date(),
                    created,
                    updated,
                    None if active else updated,
                    20,
                )
            )
            event_index = 0

            def event(
                kind, value, at, previous=None, actor=None, key=key, issue_id=issue_id, owner_id=owner.id
            ):
                nonlocal event_index
                repo.add(
                    AuditEvent(
                        identifier(f"{key}/event/{event_index}"),
                        issue_id,
                        actor or owner_id,
                        kind,
                        previous,
                        value,
                        at,
                    )
                )
                event_index += 1

            event("ISSUE_CREATED", {"title": title, "status": "OPEN"}, created, actor=reporter.id)
            if status != IssueStatus.OPEN:
                event(
                    "STATUS_CHANGED",
                    {"status": "IN_PROGRESS"},
                    created + timedelta(minutes=30),
                    {"status": "OPEN"},
                )
            action_titles = rng.sample(VARIED_ACTIONS, rng.randint(1, 5))
            for j, action_title in enumerate(action_titles):
                closed = status in (IssueStatus.MITIGATED, IssueStatus.RESOLVED)
                cancelled = j > 0 and rng.random() < 0.12
                done = not cancelled and (closed or status == IssueStatus.IN_PROGRESS and rng.random() < 0.4)
                action_status = (
                    ActionStatus.CANCELLED
                    if cancelled
                    else ActionStatus.DONE
                    if done
                    else rng.choice([ActionStatus.TODO, ActionStatus.IN_PROGRESS])
                )
                planned = created + timedelta(hours=2 + j)
                completed = created + duration * rng.uniform(0.3, 0.78) if done else None
                action_owner = rng.choice(users)
                action = MitigationAction(
                    identifier(f"{key}/action/{j}"),
                    issue_id,
                    f"{action_title} · {scope}",
                    f"{action_title} for the affected {scope} records.",
                    action_owner.id,
                    action_status,
                    (created + duration * rng.uniform(0.4, 1.0) + timedelta(days=rng.randint(-3, 12))).date(),
                    completed,
                    planned,
                )
                repo.add(action)
                event("ACTION_PLANNED", {"action_id": str(action.id), "title": action.title}, planned)
                if done:
                    event(
                        "ACTION_COMPLETED",
                        {"action_id": str(action.id), "title": action.title, "status": "DONE"},
                        completed,
                        actor=action_owner.id,
                    )
                elif cancelled:
                    event(
                        "ACTION_STATUS_CHANGED",
                        {"action_id": str(action.id), "status": "CANCELLED"},
                        created + duration * 0.79,
                        {"status": "TODO"},
                        actor=action_owner.id,
                    )
            if status in (IssueStatus.MITIGATED, IssueStatus.RESOLVED):
                event(
                    "STATUS_CHANGED",
                    {"status": "MITIGATED"},
                    created + duration * 0.82,
                    {"status": "IN_PROGRESS"},
                )
            reviews = rng.randint(2, 8)
            previous = None
            for review in range(reviews):
                final = review == reviews - 1
                target = (
                    pair
                    if final
                    else (
                        min(5, max(1, pair[0] + rng.randint(-1, 3))),
                        min(5, max(1, pair[1] + rng.randint(-1, 3))),
                    )
                )
                rating, severity = risk_score(*target)
                at = created + duration * (0.02 + review / (reviews - 1) * 0.94)
                rationale = rng.choice(
                    [
                        "Control sample reviewed with the owner.",
                        "Monitoring evidence checked against the baseline.",
                        "Independent verification completed.",
                        "The service team reviewed the impact estimate.",
                        "Exception scope refined after testing.",
                        "Exposure reviewed against the latest evidence.",
                    ]
                )
                if final and not active:
                    rationale = "Residual risk reviewed after the completed corrective work."
                repo.add(
                    RiskAssessment(
                        identifier(f"{key}/risk/{review}"),
                        issue_id,
                        *target,
                        rating,
                        severity,
                        rationale,
                        rng.choice(users).id,
                        at,
                    )
                )
                event(
                    "RISK_ASSESSED",
                    {"score": rating, "severity": severity, "likelihood": target[0], "impact": target[1]},
                    at,
                    {"score": previous} if previous is not None else None,
                )
                previous = rating
            for j, body in enumerate(
                rng.sample(
                    [
                        "Scope confirmed with the service owner.",
                        "The fallback test passed.",
                        "A further sample is needed.",
                        "Revised thresholds are under observation.",
                        "Recovery timing checked against the runbook.",
                        "The exception is limited to one region.",
                        "Verification notes recorded in the action.",
                        "The owner has confirmed the next review date.",
                        "The rollout is being monitored.",
                        "The control sample is ready for review.",
                        "Supplier evidence has been reviewed.",
                        "The remaining records are queued for reconciliation.",
                    ],
                    rng.randrange(5),
                )
            ):
                author = rng.choice(users)
                at = created + duration * (0.12 + j * 0.19)
                comment = Comment(identifier(f"{key}/comment/{j}"), issue_id, author.id, body, at)
                repo.add(comment)
                event("COMMENT_ADDED", {"comment_id": str(comment.id)}, at, actor=author.id)
            if not active:
                event("STATUS_CHANGED", {"status": "RESOLVED"}, updated, {"status": "MITIGATED"})
    return added


if __name__ == "__main__":
    if not DEMO_MODE:
        raise SystemExit("Demo seeding requires DEMO_MODE=true.")
    _, factory = make_uow(DATABASE_URL)
    base_added = seed(factory)
    history_added = seed_history(factory)
    print(
        "Demo portfolio and history added."
        if base_added or history_added
        else "Demo portfolio already exists; no records changed."
    )
