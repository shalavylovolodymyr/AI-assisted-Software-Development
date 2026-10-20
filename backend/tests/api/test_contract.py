from uuid import uuid4

from integration.test_workflow import create_issue


def test_missing_entities_validation_and_pagination(client, users, project):
    issue = create_issue(client, users, project)
    assert client.get("/api/v1/issues/" + str(uuid4())).status_code == 404
    assert client.get("/api/v1/issues?page=0").status_code == 422
    assert client.get("/api/v1/issues?page_size=101").status_code == 422
    assert client.get("/api/v1/issues?sort=unsafe_column").status_code == 422
    assert client.get("/api/v1/issues?severity=CRITICAL").json()["total"] == 1
    assert client.get("/api/v1/issues?severity=LOW").json()["total"] == 0
    assert client.get("/api/v1/issues?search=Privileged").json()["items"][0]["id"] == issue["id"]
    assert client.get("/api/v1/issues?project_id=" + str(uuid4())).json()["total"] == 0
    for sort in ("risk_score", "due_date", "title", "created_at", "reference_code"):
        assert client.get("/api/v1/issues?sort=" + sort).status_code == 200


def test_comments_edits_and_audit(client, users, project):
    issue = create_issue(client, users, project)
    url = "/api/v1/issues/" + issue["id"]
    assert client.patch(url, json={"expected_version": 1}).status_code == 422
    assert client.patch(url, json={"title": None, "expected_version": 1}).status_code == 422
    assert client.post(url + "/comments", json={"body": " ", "expected_version": 1}).status_code == 422
    response = client.patch(
        url,
        json={
            "title": "Reviewed access scope",
            "assignee_id": users[1]["id"],
            "due_date": None,
            "expected_version": 1,
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["assignee_id"] == users[1]["id"]
    assert (
        client.post(url + "/comments", json={"body": "Evidence reviewed.", "expected_version": 2}).status_code
        == 201
    )
    assert client.get(url + "/comments").json()[0]["body"] == "Evidence reviewed."
    events = client.get(url + "/activity").json()
    assert any(e["event_type"] == "ASSIGNMENT_CHANGED" for e in events)
    assert client.get("/api/v1/activity?page_size=1").json()["total"] == 4


def test_derived_dashboard_and_analytics(client, users, project):
    issue = create_issue(client, users, project)
    d = client.get("/api/v1/dashboard/summary").json()
    assert d["active_issues"] == 1 and d["critical_risks"] == 1
    assert d["resolved_issues"] == 0 and d["mitigation"]["progress"] == 0
    assert sum(c["count"] for c in d["matrix"]) == 1
    assert len(client.get("/api/v1/analytics/risk-matrix").json()) == 25
    assert sum(c["count"] for c in client.get("/api/v1/analytics/risk-distribution").json()) == 1
    assert client.get("/api/v1/projects/" + project["id"]).status_code == 200
    assert client.get("/api/v1/projects/" + str(uuid4())).status_code == 404
    assert client.get("/health").json()["database"] == "connected"
    assert client.get("/api/v1/issues/" + issue["id"] + "/risk-assessments").json()[0]["score"] == 20
    health = client.get("/api/v1/analytics/operations")
    assert health.status_code == 200, health.text
    data = health.json()
    assert sum(row["count"] for row in data["aging"]) == 1
    assert data["projects"][0]["active"] == 1
    assert data["metrics"]["unplanned_issues"] == 1


def test_demo_identity_is_explicit_and_validated(client, users, project):
    client.headers.pop("X-Demo-User")
    assert client.post("/api/v1/issues", json={}).status_code == 403
    client.headers["X-Demo-User"] = str(uuid4())
    response = client.post(
        "/api/v1/issues",
        json={
            "project_id": project["id"],
            "title": "Test",
            "description": "Test",
            "category": "OTHER",
            "priority": "LOW",
            "assignee_id": users[0]["id"],
            "likelihood": 2,
            "impact": 2,
            "rationale": "Test",
        },
    )
    assert response.status_code == 404
    client.app.state.demo_mode = False
    assert client.post("/api/v1/issues", json={}).status_code == 403
    assert client.get("/api/v1/config").json()["demo_mode"] is False


def test_active_issue_filter_excludes_resolved(database):
    from fastapi.testclient import TestClient

    from signal_app.main import create_app
    from signal_app.seed import seed

    seed(database[1])
    client = TestClient(create_app(database[1]))
    assert client.get("/api/v1/issues").json()["total"] == 24
    response = client.get("/api/v1/issues?active_only=true")
    assert response.json()["total"] == 18
    assert all(issue["status"] != "RESOLVED" for issue in response.json()["items"])


def test_trend_contract_and_searchable_history(client, users, project):
    issue = create_issue(client, users, project)
    response = client.get("/api/v1/analytics/trends?days=30")
    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data["timeline"]) == 30
    assert data["metrics"]["created"] == data["metrics"]["assessments"] == 1
    assert data["timeline"][-1]["average_risk"] == 20
    assert data["metrics"]["resolution_days"] is None
    assert client.get("/api/v1/analytics/trends?days=0").status_code == 422
    assert client.get("/api/v1/analytics/trends?days=366").status_code == 422
    history = client.get(
        "/api/v1/activity",
        params={
            "search": issue["reference_code"],
            "event_type": "RISK_ASSESSED",
            "project_id": project["id"],
        },
    ).json()
    assert history["total"] == 1 and history["items"][0]["event_type"] == "RISK_ASSESSED"
    assert client.get("/api/v1/activity?search=no-matching-event").json()["total"] == 0
    assert client.get("/api/v1/activity?project_id=" + str(uuid4())).json()["total"] == 0


def test_owner_focus_filters_issues_before_pagination(client, users, project):
    create_issue(client, users, project)
    owner = users[0]["id"]
    assert client.get("/api/v1/issues", params={"assignee_id": owner}).json()["total"] == 1
    assert client.get("/api/v1/issues", params={"assignee_id": users[1]["id"]}).json()["total"] == 0
