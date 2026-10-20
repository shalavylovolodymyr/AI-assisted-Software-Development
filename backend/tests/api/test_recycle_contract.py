from concurrent.futures import ThreadPoolExecutor
from uuid import UUID

from integration.test_workflow import create_issue

from signal_app.application.services import Deletion
from signal_app.domain.exceptions import Conflict


def test_delete_preflight_is_allowed_for_the_local_frontend(client):
    response = client.options(
        "/api/v1/issues/00000000-0000-0000-0000-000000000001",
        headers={
            "Origin": "http://127.0.0.1:5178",
            "Access-Control-Request-Method": "DELETE",
            "Access-Control-Request-Headers": "content-type,x-demo-user",
        },
    )
    assert response.status_code == 200
    assert "DELETE" in response.headers["access-control-allow-methods"]


def test_issue_delete_restore_retains_history_and_concurrency(client, users, project, database):
    issue = create_issue(client, users, project)
    url = "/api/v1/issues/" + issue["id"]
    assert client.get("/api/v1/config").json()["deletion"] is True
    client.post(url + "/comments", json={"body": "Keep this evidence", "expected_version": 1})

    def remove():
        try:
            Deletion(database[1]).issue(UUID(issue["id"]), UUID(users[0]["id"]), 2)
            return "ok"
        except Conflict:
            return "stale"

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(lambda _: remove(), range(2))) == ["ok", "stale"]
    detail = client.get(url).json()
    assert detail["deleted_at"] and detail["version"] == 3
    assert len(detail["assessments"]) == 1 and detail["comments"][0]["body"] == "Keep this evidence"
    assert sum(e["event_type"] == "ISSUE_DELETED" for e in detail["activity"]) == 1
    assert client.get("/api/v1/issues").json()["total"] == 0
    assert client.get("/api/v1/issues?deleted=true").json()["total"] == 1
    assert client.get("/api/v1/dashboard/summary").json()["total_issues"] == 0
    assert client.patch(url, json={"title": "Blocked", "expected_version": 3}).status_code == 409
    assert client.request("DELETE", url, json={"expected_version": 3}).status_code == 409
    assert client.post(url + "/restore", json={"expected_version": 2}).status_code == 409
    restored = client.post(url + "/restore", json={"expected_version": 3})
    assert restored.status_code == 200 and restored.json()["deleted_at"] is None
    assert client.get("/api/v1/issues").json()["total"] == 1
    assert client.request("DELETE", url, json={"expected_version": 4}).status_code == 200


def test_action_delete_restore_keeps_parent_version_and_member_permissions(client, users, project):
    manager = next(u for u in users if u["role"] == "MANAGER")
    member = next(u for u in users if u["role"] == "MEMBER")
    issue = create_issue(client, users, project)
    url = "/api/v1/issues/" + issue["id"]
    action = client.post(
        url + "/actions",
        json={
            "title": "Unneeded action",
            "description": "Recorded detail",
            "owner_id": manager["id"],
            "due_date": "2026-10-01",
            "expected_version": 1,
        },
    ).json()
    action_url = "/api/v1/actions/" + action["id"]
    client.headers["X-Demo-User"] = member["id"]
    assert client.request("DELETE", action_url, json={"expected_version": 2}).status_code == 403
    client.headers["X-Demo-User"] = manager["id"]
    removed = client.request("DELETE", action_url, json={"expected_version": 2})
    assert removed.status_code == 200 and removed.json()["deleted_at"]
    assert client.get("/api/v1/actions").json() == []
    assert client.get(url).json()["actions"] == []
    assert client.get("/api/v1/actions?deleted=true").json()[0]["id"] == action["id"]
    assert client.get(url).json()["version"] == 3
    assert client.post(action_url + "/restore", json={"expected_version": 3}).status_code == 200
    assert client.get(url).json()["actions"][0]["id"] == action["id"]
    assert client.patch(action_url, json={"status": "DONE", "expected_version": 4}).status_code == 200
    assert client.request("DELETE", action_url, json={"expected_version": 5}).status_code == 409
