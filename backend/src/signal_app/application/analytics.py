"""Read-only analytics replay persisted events; no stored or simulated metrics."""

from collections import Counter
from datetime import UTC, datetime, time, timedelta

from signal_app.domain.enums import ActionStatus, Category, IssueStatus


def build_trends(issues, assessments, actions, events, days, now):
    start = datetime.combine(now.date() - timedelta(days=days - 1), time.min, UTC)
    issues = sorted((i for i in issues if i.created_at <= now), key=lambda i: i.created_at)
    assessments = sorted(
        (r for r in assessments if r.assessed_at <= now), key=lambda r: (r.assessed_at, str(r.id))
    )
    events = sorted((e for e in events if e.occurred_at <= now), key=lambda e: (e.occurred_at, str(e.id)))
    statuses = [e for e in events if e.event_type in ("STATUS_CHANGED", "ISSUE_REOPENED")]
    resolutions = [e for e in statuses if e.new_value.get("status") == IssueStatus.RESOLVED]
    created = Counter(i.created_at.astimezone(UTC).date() for i in issues)
    resolved = Counter(e.occurred_at.astimezone(UTC).date() for e in resolutions)
    completed = Counter(
        a.completed_at.astimezone(UTC).date() for a in actions if a.completed_at and a.completed_at <= now
    )
    changes = Counter(e.occurred_at.astimezone(UTC).date() for e in events)
    state, risks, timeline = {}, {}, []
    ip = sp = rp = 0
    for offset in range(days):
        day = start.date() + timedelta(days=offset)
        cutoff = min(
            datetime.combine(day + timedelta(days=1), time.min, UTC) - timedelta(microseconds=1), now
        )
        while ip < len(issues) and issues[ip].created_at <= cutoff:
            state[issues[ip].id] = IssueStatus.OPEN
            ip += 1
        while sp < len(statuses) and statuses[sp].occurred_at <= cutoff:
            event = statuses[sp]
            if event.issue_id in state:
                state[event.issue_id] = event.new_value["status"]
            sp += 1
        while rp < len(assessments) and assessments[rp].assessed_at <= cutoff:
            risk = assessments[rp]
            risks[risk.issue_id] = risk.score
            rp += 1
        active = {identifier for identifier, status in state.items() if status != IssueStatus.RESOLVED}
        scores = [score for identifier, score in risks.items() if identifier in active]
        timeline.append(
            {
                "date": day,
                "created": created[day],
                "resolved": resolved[day],
                "active": len(active),
                "average_risk": round(sum(scores) / len(scores), 1) if scores else None,
                "completed_actions": completed[day],
                "events": changes[day],
            }
        )
    issue_lookup = {i.id: i for i in issues}
    durations = [
        (e.occurred_at - issue_lookup[e.issue_id].created_at).total_seconds() / 86400
        for e in resolutions
        if e.occurred_at >= start and e.issue_id in issue_lookup
    ]
    categories = Counter(i.category for i in issues if state.get(i.id) != IssueStatus.RESOLVED)
    return {
        "days": days,
        "generated_at": now,
        "timeline": timeline,
        "metrics": {
            "created": sum(d["created"] for d in timeline),
            "resolved": sum(d["resolved"] for d in timeline),
            "completed_actions": sum(d["completed_actions"] for d in timeline),
            "assessments": sum(r.assessed_at >= start for r in assessments),
            "events": sum(d["events"] for d in timeline),
            "resolution_days": round(sum(durations) / len(durations), 1) if durations else None,
        },
        "categories": [{"category": category, "count": categories[category]} for category in Category],
        "action_statuses": [
            {"status": status, "count": sum(a.status == status for a in actions)} for status in ActionStatus
        ],
        "total_events": len(events),
    }
