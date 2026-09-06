from fastapi import status


def test_database_and_entry_crud(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    database = client.post(
        f"/api/v1/workspaces/{workspace_id}/databases/",
        headers=headers,
        json={"title": "Team Directory", "properties": {"columns": ["Name", "Role"]}},
    )
    assert database.status_code == status.HTTP_201_CREATED, database.text
    database_id = database.json()["database_id"]

    entry = client.post(
        f"/api/v1/workspaces/{workspace_id}/databases/{database_id}/entries",
        headers=headers,
        json={"title": "Jane Doe", "content": {"Role": "Engineer"}},
    )
    assert entry.status_code == status.HTTP_201_CREATED, entry.text
    entry_id = entry.json()["entry_id"]

    entries = client.get(f"/api/v1/workspaces/{workspace_id}/databases/{database_id}/entries", headers=headers)
    assert entry_id in [e["entry_id"] for e in entries.json()]

    updated_entry = client.put(
        f"/api/v1/workspaces/{workspace_id}/databases/{database_id}/entries/{entry_id}",
        headers=headers,
        json={"content": {"Role": "Staff Engineer"}},
    )
    assert updated_entry.status_code == status.HTTP_200_OK, updated_entry.text
    assert updated_entry.json()["content"]["Role"] == "Staff Engineer"

    deleted_entry = client.delete(
        f"/api/v1/workspaces/{workspace_id}/databases/{database_id}/entries/{entry_id}", headers=headers
    )
    assert deleted_entry.status_code == status.HTTP_204_NO_CONTENT

    after_delete_entries = client.get(
        f"/api/v1/workspaces/{workspace_id}/databases/{database_id}/entries", headers=headers
    )
    assert entry_id not in [e["entry_id"] for e in after_delete_entries.json()]

    deleted_db = client.delete(f"/api/v1/workspaces/{workspace_id}/databases/{database_id}", headers=headers)
    assert deleted_db.status_code == status.HTTP_204_NO_CONTENT
