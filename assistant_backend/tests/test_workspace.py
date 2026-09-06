import uuid
from fastapi import status


def test_get_and_update_workspace(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    got = client.get(f"/api/v1/workspaces/workspace/{workspace_id}", headers=headers)
    assert got.status_code == status.HTTP_200_OK, got.text
    assert got.json()["workspace_id"] == workspace_id

    updated = client.put(
        f"/api/v1/workspaces/workspace/{workspace_id}",
        headers=headers,
        json={"workspace_id": workspace_id, "name": "Renamed Workspace"},
    )
    assert updated.status_code == status.HTTP_200_OK, updated.text
    assert updated.json()["name"] == "Renamed Workspace"


def test_invite_list_role_update_and_remove_member(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    owner_headers = signed_up_user["headers"]

    member_email = f"member-{uuid.uuid4()}@example.com"
    client.post(
        "/api/v1/users/signup",
        json={"email": member_email, "password": "TestPass123!", "first_name": "Member", "last_name": "User"},
    )

    invited = client.post(
        f"/api/v1/workspaces/{workspace_id}/invite",
        headers=owner_headers,
        json={"email": member_email, "role": "member"},
    )
    assert invited.status_code == status.HTTP_200_OK, invited.text

    members = client.get(f"/api/v1/workspaces/{workspace_id}/members", headers=owner_headers)
    assert members.status_code == status.HTTP_200_OK, members.text
    member_row = next(m for m in members.json() if m["email"] == member_email)
    assert member_row["role"] == "member"

    role_updated = client.put(
        f"/api/v1/workspaces/{workspace_id}/users/{member_row['user_id']}/role",
        headers=owner_headers,
        json={"role": "admin"},
    )
    assert role_updated.status_code == status.HTTP_200_OK, role_updated.text

    removed = client.delete(
        f"/api/v1/workspaces/{workspace_id}/users/{member_row['user_id']}",
        headers=owner_headers,
    )
    assert removed.status_code == status.HTTP_204_NO_CONTENT, removed.text

    members_after = client.get(f"/api/v1/workspaces/{workspace_id}/members", headers=owner_headers)
    assert member_row["user_id"] not in [m["user_id"] for m in members_after.json()]


def test_invite_unknown_email_404s(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    resp = client.post(
        f"/api/v1/workspaces/{workspace_id}/invite",
        headers=headers,
        json={"email": f"nobody-{uuid.uuid4()}@example.com", "role": "member"},
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND
