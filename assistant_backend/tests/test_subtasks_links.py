from fastapi import status


def test_subtask_creation_and_one_level_limit(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    parent = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Implement payment gateway"},
    ).json()

    sub = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Integrate Stripe SDK", "parent_task_id": parent["task_id"]},
    )
    assert sub.status_code == status.HTTP_201_CREATED, sub.text
    assert sub.json()["parent_task_id"] == parent["task_id"]

    nested = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Nested subtask", "parent_task_id": sub.json()["task_id"]},
    )
    assert nested.status_code == status.HTTP_400_BAD_REQUEST

    got_parent = client.get(f"/api/v1/workspaces/{workspace_id}/tasks/{parent['task_id']}", headers=headers)
    assert [s["task_id"] for s in got_parent.json()["subtasks"]] == [sub.json()["task_id"]]


def test_deleting_parent_cascades_to_subtasks(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    parent = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Parent to delete"},
    ).json()
    sub = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Subtask of deleted parent", "parent_task_id": parent["task_id"]},
    ).json()

    deleted = client.delete(f"/api/v1/workspaces/{workspace_id}/tasks/{parent['task_id']}", headers=headers)
    assert deleted.status_code == status.HTTP_204_NO_CONTENT, deleted.text

    got_sub = client.get(f"/api/v1/workspaces/{workspace_id}/tasks/{sub['task_id']}", headers=headers)
    assert got_sub.status_code == status.HTTP_404_NOT_FOUND


def test_task_link_create_list_inverse_label_and_delete(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    a = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Blocks the other task"},
    ).json()
    b = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Blocked task"},
    ).json()

    link = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks/{a['task_id']}/links/",
        headers=headers,
        json={"target_task_id": b["task_id"], "link_type": "blocks"},
    )
    assert link.status_code == status.HTTP_201_CREATED, link.text
    assert link.json()["display_label"] == "blocks"
    link_id = link.json()["link_id"]

    from_b = client.get(f"/api/v1/workspaces/{workspace_id}/tasks/{b['task_id']}/links/", headers=headers)
    assert from_b.status_code == status.HTTP_200_OK, from_b.text
    assert from_b.json()[0]["display_label"] == "is blocked by"

    deleted = client.delete(
        f"/api/v1/workspaces/{workspace_id}/tasks/{a['task_id']}/links/{link_id}",
        headers=headers,
    )
    assert deleted.status_code == status.HTTP_204_NO_CONTENT, deleted.text
    assert client.get(f"/api/v1/workspaces/{workspace_id}/tasks/{b['task_id']}/links/", headers=headers).json() == []


def test_task_link_rejects_self_link_and_duplicates(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    a = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks", headers=headers, json={"title": "Task A"}
    ).json()
    b = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks", headers=headers, json={"title": "Task B"}
    ).json()

    self_link = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks/{a['task_id']}/links/",
        headers=headers,
        json={"target_task_id": a["task_id"], "link_type": "relates_to"},
    )
    assert self_link.status_code == status.HTTP_400_BAD_REQUEST

    first = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks/{a['task_id']}/links/",
        headers=headers,
        json={"target_task_id": b["task_id"], "link_type": "relates_to"},
    )
    assert first.status_code == status.HTTP_201_CREATED

    duplicate = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks/{a['task_id']}/links/",
        headers=headers,
        json={"target_task_id": b["task_id"], "link_type": "relates_to"},
    )
    assert duplicate.status_code == status.HTTP_400_BAD_REQUEST
