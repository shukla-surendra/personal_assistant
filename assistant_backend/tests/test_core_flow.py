"""
Real end-to-end coverage of the primary user journey: signup -> login ->
profile -> workspace's auto-created default board -> task CRUD.

Every path/payload here was verified by hand against the running backend
before being written down -- this app's DTOs have drifted from its models
more than once (see PROGRESS notes), so a test asserting against what the
code merely claims to do would just encode the same wrong assumption.
"""
from fastapi import status


def test_signup_creates_user_and_default_workspace(client):
    email = "core-flow-signup@example.com"
    resp = client.post(
        "/api/v1/users/signup",
        json={
            "email": email,
            "password": "TestPass123!",
            "first_name": "Core",
            "last_name": "Flow",
        },
    )
    assert resp.status_code == status.HTTP_201_CREATED, resp.text
    body = resp.json()
    assert body["email"] == email
    assert body["status"] == "ACTIVE"
    assert body["role"] == "USER"
    assert "user_id" in body
    assert body["default_workspace"]["workspace_name"]


def test_signup_duplicate_email_is_rejected(client):
    email = "core-flow-dup@example.com"
    payload = {
        "email": email,
        "password": "TestPass123!",
        "first_name": "Dup",
        "last_name": "User",
    }
    first = client.post("/api/v1/users/signup", json=payload)
    assert first.status_code == status.HTTP_201_CREATED

    second = client.post("/api/v1/users/signup", json=payload)
    assert second.status_code == status.HTTP_409_CONFLICT, second.text


def test_login_wrong_password_is_rejected(client, signed_up_user):
    resp = client.post(
        "/api/v1/users/login",
        json={"email": signed_up_user["email"], "password": "wrong-password"},
    )
    assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST)


def test_me_requires_auth(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == status.HTTP_403_FORBIDDEN


def test_me_returns_profile(client, signed_up_user):
    resp = client.get("/api/v1/users/me", headers=signed_up_user["headers"])
    assert resp.status_code == status.HTTP_200_OK, resp.text
    body = resp.json()
    assert body["user_id"] == signed_up_user["user_id"]
    assert body["email"] == signed_up_user["email"]


def test_default_board_was_auto_created_on_signup(client, signed_up_user):
    resp = client.get(
        f"/api/v1/workspaces/{signed_up_user['workspace_id']}/boards/",
        headers=signed_up_user["headers"],
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    boards = resp.json()
    assert len(boards) >= 1
    assert boards[0]["name"]


def test_create_and_list_task(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    create = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Write tests", "description": "cover the core flow", "priority": "high"},
    )
    assert create.status_code == status.HTTP_201_CREATED, create.text
    task = create.json()
    assert task["title"] == "Write tests"
    assert task["workspace_id"] == workspace_id
    assert task["user_id"] == signed_up_user["user_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/tasks", headers=headers)
    assert listed.status_code == status.HTTP_200_OK, listed.text
    ids = [t["task_id"] for t in listed.json()]
    assert task["task_id"] in ids


def test_get_single_task(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    create = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Fetch me later"},
    )
    task_id = create.json()["task_id"]

    resp = client.get(f"/api/v1/workspaces/{workspace_id}/tasks/{task_id}", headers=headers)
    assert resp.status_code == status.HTTP_200_OK, resp.text
    assert resp.json()["task_id"] == task_id


def test_delete_task(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    create = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Delete me"},
    )
    task_id = create.json()["task_id"]

    deleted = client.delete(f"/api/v1/workspaces/{workspace_id}/tasks/{task_id}", headers=headers)
    assert deleted.status_code == status.HTTP_204_NO_CONTENT, deleted.text
