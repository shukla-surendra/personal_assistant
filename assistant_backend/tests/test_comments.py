"""
CommentCommand requires workspace_id/user_id directly in the body (the
controller asserts they match the URL/auth token rather than filling them
in itself, unlike most other commands in this app) -- sent explicitly here
to match what the API actually requires.
"""
from fastapi import status


def test_comment_crud_and_visible_to_thread(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    user_id = signed_up_user["user_id"]
    headers = signed_up_user["headers"]

    task = client.post(
        f"/api/v1/workspaces/{workspace_id}/tasks",
        headers=headers,
        json={"title": "Task with a comment thread"},
    ).json()
    task_id = task["task_id"]

    created = client.post(
        f"/api/v1/workspaces/{workspace_id}/comments/",
        headers=headers,
        json={"workspace_id": workspace_id, "user_id": user_id, "task_id": task_id, "content": "First comment"},
    )
    assert created.status_code == status.HTTP_201_CREATED, created.text
    comment_id = created.json()["comment_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/comments/tasks/{task_id}", headers=headers)
    assert listed.status_code == status.HTTP_200_OK, listed.text
    assert comment_id in [c["comment_id"] for c in listed.json()]

    updated = client.put(
        f"/api/v1/workspaces/{workspace_id}/comments/{comment_id}",
        headers=headers,
        json={"content": "Edited comment"},
    )
    assert updated.status_code == status.HTTP_200_OK, updated.text
    assert updated.json()["content"] == "Edited comment"

    deleted = client.delete(f"/api/v1/workspaces/{workspace_id}/comments/{comment_id}", headers=headers)
    assert deleted.status_code == status.HTTP_204_NO_CONTENT, deleted.text

    after_delete = client.get(f"/api/v1/workspaces/{workspace_id}/comments/tasks/{task_id}", headers=headers)
    assert comment_id not in [c["comment_id"] for c in after_delete.json()]
