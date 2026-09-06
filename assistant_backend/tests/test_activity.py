from fastapi import status


def test_activity_create_list_get_update(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    user_id = signed_up_user["user_id"]
    headers = signed_up_user["headers"]

    task = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Task with activity"},
    ).json()

    created = client.post(
        f"/api/v1/workspaces/{workspace_id}/activities/",
        headers=headers,
        json={
            "workspace_id": workspace_id,
            "user_id": user_id,
            "action": "created",
            "entity_id": task["task_id"],
            "entity_type": "task",
        },
    )
    assert created.status_code == status.HTTP_201_CREATED, created.text
    activity_id = created.json()["activity_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/activities/", headers=headers)
    assert activity_id in [a["activity_id"] for a in listed.json()]

    got = client.get(f"/api/v1/workspaces/{workspace_id}/activities/{activity_id}", headers=headers)
    assert got.status_code == status.HTTP_200_OK, got.text

    updated = client.put(
        f"/api/v1/workspaces/{workspace_id}/activities/{activity_id}",
        headers=headers,
        json={"activity_id": activity_id, "action": "updated"},
    )
    assert updated.status_code == status.HTTP_200_OK, updated.text
    assert updated.json()["action"] == "updated"
