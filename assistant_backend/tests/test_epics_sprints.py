from fastapi import status


def _create_board(client, workspace_id, headers):
    resp = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/",
        headers=headers,
        json={"name": "Board for Epics"},
    )
    assert resp.status_code == status.HTTP_201_CREATED, resp.text
    return resp.json()["board_id"]


def test_create_and_list_epic(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]
    board_id = _create_board(client, workspace_id, headers)

    created = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/epics/",
        headers=headers,
        json={"title": "Checkout Revamp", "color": "#36B37E"},
    )
    assert created.status_code == status.HTTP_201_CREATED, created.text
    epic = created.json()
    assert epic["title"] == "Checkout Revamp"
    assert epic["status"] == "open"

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/epics/", headers=headers)
    assert listed.status_code == status.HTTP_200_OK, listed.text
    assert epic["epic_id"] in [e["epic_id"] for e in listed.json()]


def test_delete_epic_unassigns_it_from_tasks(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]
    board_id = _create_board(client, workspace_id, headers)

    epic = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/epics/",
        headers=headers,
        json={"title": "Epic to delete"},
    ).json()

    task = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Task in epic", "board_id": board_id, "epic_id": epic["epic_id"]},
    ).json()
    assert task["epic_id"] == epic["epic_id"]

    deleted = client.delete(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/epics/{epic['epic_id']}",
        headers=headers,
    )
    assert deleted.status_code == status.HTTP_204_NO_CONTENT, deleted.text

    refreshed = client.get(f"/api/v1/workspaces/{workspace_id}/tasks/{task['task_id']}", headers=headers)
    assert refreshed.json()["epic_id"] is None


def test_sprint_lifecycle(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]
    board_id = _create_board(client, workspace_id, headers)

    sprint = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/sprints/",
        headers=headers,
        json={"name": "Sprint 1", "goal": "Ship MVP"},
    )
    assert sprint.status_code == status.HTTP_201_CREATED, sprint.text
    sprint_id = sprint.json()["sprint_id"]
    assert sprint.json()["status"] == "planned"

    started = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/sprints/{sprint_id}/start",
        headers=headers,
    )
    assert started.status_code == status.HTTP_200_OK, started.text
    assert started.json()["status"] == "active"

    # A board can only have one active sprint at a time.
    second_sprint = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/sprints/",
        headers=headers,
        json={"name": "Sprint 2"},
    ).json()
    blocked_start = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/sprints/{second_sprint['sprint_id']}/start",
        headers=headers,
    )
    assert blocked_start.status_code == status.HTTP_400_BAD_REQUEST

    # A task left in an active sprint when it's completed (not done) goes
    # back to the backlog rather than staying attached to a closed sprint.
    task = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "In sprint", "board_id": board_id, "sprint_id": sprint_id},
    ).json()

    completed = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/sprints/{sprint_id}/complete",
        headers=headers,
    )
    assert completed.status_code == status.HTTP_200_OK, completed.text
    assert completed.json()["status"] == "completed"

    refreshed_task = client.get(f"/api/v1/workspaces/{workspace_id}/tasks/{task['task_id']}", headers=headers)
    assert refreshed_task.json()["sprint_id"] is None


def test_backlog_and_sprint_task_filters(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]
    board_id = _create_board(client, workspace_id, headers)

    sprint_id = client.post(
        f"/api/v1/workspaces/{workspace_id}/boards/{board_id}/sprints/",
        headers=headers,
        json={"name": "Sprint A"},
    ).json()["sprint_id"]

    backlog_task = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Backlog task", "board_id": board_id},
    ).json()
    sprint_task = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Sprint task", "board_id": board_id, "sprint_id": sprint_id},
    ).json()

    backlog = client.get(
        f"/api/v1/workspaces/{workspace_id}/tasks?board_id={board_id}&backlog_only=true",
        headers=headers,
    ).json()
    backlog_ids = [t["task_id"] for t in backlog]
    assert backlog_task["task_id"] in backlog_ids
    assert sprint_task["task_id"] not in backlog_ids

    in_sprint = client.get(
        f"/api/v1/workspaces/{workspace_id}/tasks?board_id={board_id}&sprint_id={sprint_id}",
        headers=headers,
    ).json()
    assert [t["task_id"] for t in in_sprint] == [sprint_task["task_id"]]


def test_story_points_round_trip(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    created = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Estimate me", "story_points": 8},
    )
    assert created.status_code == status.HTTP_201_CREATED, created.text
    task = created.json()
    assert task["story_points"] == 8

    updated = client.put(
        f"/api/v1/workspaces/{workspace_id}/tasks/{task['task_id']}",
        headers=headers,
        json={
            "task_id": task["task_id"],
            "workspace_id": workspace_id,
            "user_id": signed_up_user["user_id"],
            "story_points": 13,
        },
    )
    assert updated.status_code == status.HTTP_200_OK, updated.text
    assert updated.json()["story_points"] == 13
