from fastapi import status


def test_notification_crud_and_read_toggle(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    created = client.post(
        f"/api/v1/workspaces/{workspace_id}/notifications/",
        headers=headers,
        json={"title": "New comment", "message": "Someone commented", "type": "info"},
    )
    assert created.status_code == status.HTTP_201_CREATED, created.text
    notification = created.json()
    assert notification["is_read"] is False
    notification_id = notification["notification_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/notifications/", headers=headers)
    assert notification_id in [n["notification_id"] for n in listed.json()]

    read = client.put(
        f"/api/v1/workspaces/{workspace_id}/notifications/{notification_id}",
        headers=headers,
        json={"is_read": True},
    )
    assert read.status_code == status.HTTP_200_OK, read.text
    assert read.json()["is_read"] is True

    deleted = client.delete(f"/api/v1/workspaces/{workspace_id}/notifications/{notification_id}", headers=headers)
    assert deleted.status_code == status.HTTP_204_NO_CONTENT
