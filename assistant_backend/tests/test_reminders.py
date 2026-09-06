from fastapi import status


def test_reminder_crud_and_completion_toggle(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    created = client.post(
        f"/api/v1/workspaces/{workspace_id}/reminders/",
        headers=headers,
        json={"title": "Renew domain", "due_date": "2026-12-01T09:00:00"},
    )
    assert created.status_code == status.HTTP_201_CREATED, created.text
    reminder = created.json()
    assert reminder["is_completed"] is False
    reminder_id = reminder["reminder_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/reminders/", headers=headers)
    assert reminder_id in [r["reminder_id"] for r in listed.json()]

    completed = client.put(
        f"/api/v1/workspaces/{workspace_id}/reminders/{reminder_id}",
        headers=headers,
        json={"is_completed": True},
    )
    assert completed.status_code == status.HTTP_200_OK, completed.text
    assert completed.json()["is_completed"] is True

    deleted = client.delete(f"/api/v1/workspaces/{workspace_id}/reminders/{reminder_id}", headers=headers)
    assert deleted.status_code == status.HTTP_204_NO_CONTENT

    after_delete = client.get(f"/api/v1/workspaces/{workspace_id}/reminders/{reminder_id}", headers=headers)
    assert after_delete.status_code == status.HTTP_404_NOT_FOUND
