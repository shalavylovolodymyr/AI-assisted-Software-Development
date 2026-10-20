"""Acceptance tests written before the persistence/API implementation."""

from datetime import date

import pytest


def create_issue(client, users, project):
    payload = {
        "project_id": project["id"],
        "title": "Privileged access review",
        "description": "Review access to operational systems.",
        "category": "SECURITY",
        "priority": "HIGH",
        "assignee_id": users[0]["id"],
        "due_date": str(date.today()),
        "likelihood": 4,
        "impact": 5,
        "rationale": "Broad access creates material exposure.",
    }
    response = client.post("/api/v1/issues", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_issue_is_atomic_and_assessed(client, users, project):
    issue = create_issue(client, users, project)
    assert issue["risk"]["score"] == 20
    assert issue["risk"]["severity"] == "CRITICAL"
    detail = client.get(f"/api/v1/issues/{issue['id']}").json()
    assert len(detail["assessments"]) == 1
    assert {a["event_type"] for a in detail["activity"]} == {"ISSUE_CREATED", "RISK_ASSESSED"}


def test_mitigation_reassessment_resolution_and_reopen(client, users, project):
    issue = create_issue(client, users, project)
    url = f"/api/v1/issues/{issue['id']}"
    action = client.post(
        url + "/actions",
        json={
            "title": "Remove excess permissions",
            "description": "Review all accounts",
            "owner_id": users[0]["id"],
            "due_date": str(date.today()),
            "expected_version": 1,
        },
    )
    assert action.status_code == 201, action.text

    def transition(target, version):
        return client.post(
            url + "/transitions",
            json={
                "status": target,
                "expected_version": version,
            },
        )

    assert transition("IN_PROGRESS", 2).status_code == 200
    rejected = transition("MITIGATED", 3)
    assert rejected.status_code == 409
    assert "incomplete" in rejected.json()["message"].lower()
    completed = client.patch(
        f"/api/v1/actions/{action.json()['id']}",
        json={
            "status": "DONE",
            "expected_version": 3,
        },
    )
    assert completed.status_code == 200, completed.text
    assert transition("MITIGATED", 4).status_code == 200
    assert transition("RESOLVED", 5).status_code == 409
    response = client.post(
        url + "/risk-assessments",
        json={
            "likelihood": 2,
            "impact": 2,
            "rationale": "Permissions corrected and independently reviewed.",
            "expected_version": 5,
        },
    )
    assert response.status_code == 201, response.text
    resolved = transition("RESOLVED", 6)
    assert resolved.status_code == 200, resolved.text
    assert resolved.json()["resolved_at"]
    reopened = transition("IN_PROGRESS", 7)
    assert reopened.json()["resolved_at"] is None
    detail = client.get(url).json()
    assert [r["score"] for r in detail["assessments"]] == [20, 4]
    assert detail["actions"][0]["completed_at"]
    assert any(a["event_type"] == "ISSUE_REOPENED" for a in detail["activity"])


@pytest.mark.parametrize("likelihood", [0, 6, 1.5, True, "4"])
def test_invalid_risk_leaves_no_records(client, users, project, likelihood):
    before = client.get("/api/v1/issues").json()["total"]
    response = client.post(
        "/api/v1/issues",
        json={
            "project_id": project["id"],
            "title": "Invalid risk issue",
            "description": "Test",
            "category": "OTHER",
            "priority": "LOW",
            "assignee_id": users[0]["id"],
            "likelihood": likelihood,
            "impact": 2,
            "rationale": "Invalid input",
        },
    )
    assert response.status_code == 422
    assert client.get("/api/v1/issues").json()["total"] == before
