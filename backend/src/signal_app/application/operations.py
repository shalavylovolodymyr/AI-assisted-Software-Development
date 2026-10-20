"""Current operational health derived from persisted portfolio records."""

from collections import Counter, defaultdict
from datetime import UTC

from signal_app.domain.enums import ActionStatus, IssueStatus, Severity


def build_operations(issues, assessments, actions, users, projects, now):
    today = now.astimezone(UTC).date()
    active = [i for i in issues if i.created_at <= now and i.status != IssueStatus.RESOLVED]
    active_ids = {i.id for i in active}
    history = defaultdict(list)
    for risk in sorted(assessments, key=lambda r: (r.assessed_at, str(r.id))):
        if risk.assessed_at <= now and risk.issue_id in active_ids:
            history[risk.issue_id].append(risk)
    by_issue = defaultdict(list)
    for action in actions:
        if action.created_at <= now and action.status != ActionStatus.CANCELLED:
            by_issue[action.issue_id].append(action)
    pending = [a for values in by_issue.values() for a in values
               if a.issue_id in active_ids and a.status != ActionStatus.DONE]
    aging, freshness, movement, outlook = Counter(), Counter(), Counter(), Counter()
    awaiting_review = 0
    for item in active:
        age = (today - item.created_at.astimezone(UTC).date()).days
        aging[0 if age <= 7 else 1 if age <= 30 else 2 if age <= 90 else 3] += 1
        reviews = history[item.id]
        freshness[2 if not reviews else 0 if (now - reviews[-1].assessed_at).days <= 30 else 1] += 1
        movement[3 if len(reviews) < 2 else 0 if reviews[-1].score < reviews[0].score
                 else 1 if reviews[-1].score == reviews[0].score else 2] += 1
        completions = [a.completed_at for a in by_issue[item.id]
                       if a.completed_at and a.completed_at <= now and a.status == ActionStatus.DONE]
        if completions and (not reviews or reviews[-1].assessed_at <= max(completions)):
            awaiting_review += 1
    for action in pending:
        offset = (action.due_date - today).days
        outlook[0 if offset < 0 else 1 if offset == 0 else 2 if offset <= 7 else 3] += 1

    def group(items, person_actions):
        scores = [history[i.id][-1].score for i in items if history[i.id]]
        return {
            "active": len(items),
            "critical": sum(history[i.id][-1].severity == Severity.CRITICAL for i in items if history[i.id]),
            "average_risk": round(sum(scores) / len(scores), 1) if scores else None,
            "overdue_actions": sum(a.due_date < today for a in person_actions),
        }

    owner_rows = [dict(id=u.id, name=u.full_name,
                       **group([i for i in active if i.assignee_id == u.id],
                               [a for a in pending if a.owner_id == u.id])) for u in users]
    project_rows = [dict(id=p.id, name=p.name, code=p.code,
                         **group([i for i in active if i.project_id == p.id],
                                 [a for a in pending if any(i.id == a.issue_id and i.project_id == p.id
                                                          for i in active)])) for p in projects]
    completed = [a for values in by_issue.values() for a in values
                 if a.status == ActionStatus.DONE and a.completed_at and a.completed_at <= now]
    issue_names = {i.id: i for i in active}
    people = {u.id: u for u in users}
    overdue = sorted((a for a in pending if a.due_date < today), key=lambda a: (a.due_date, str(a.id)))

    def buckets(labels, counts):
        return [{"label": name, "count": counts[index]} for index, name in enumerate(labels)]

    return {
        "generated_at": now,
        "metrics": {
            "unplanned_issues": sum(not by_issue[i.id] for i in active),
            "stale_reviews": freshness[1] + freshness[2],
            "awaiting_review": awaiting_review,
            "on_time_completion": round(100 * sum(a.completed_at.astimezone(UTC).date() <= a.due_date
                                                  for a in completed) / len(completed), 1) if completed else None,
        },
        "aging": buckets(["0–7 days", "8–30 days", "31–90 days", "90+ days"], aging),
        "review_freshness": buckets(["Reviewed ≤30d", "Older than 30d", "Not assessed"], freshness),
        "risk_movement": buckets(["Reduced", "Unchanged", "Increased", "Baseline only"], movement),
        "action_outlook": buckets(["Overdue", "Due today", "Next 7 days", "Later"], outlook),
        "owners": sorted(owner_rows, key=lambda r: (-r["active"], r["name"])),
        "projects": sorted(project_rows, key=lambda r: (-r["critical"], -r["active"], r["name"])),
        "overdue_actions": [{"id": a.id, "issue_id": a.issue_id, "title": a.title,
                             "reference": issue_names[a.issue_id].reference_code,
                             "owner": people[a.owner_id].full_name, "due_date": a.due_date,
                             "days_overdue": (today - a.due_date).days} for a in overdue],
    }
