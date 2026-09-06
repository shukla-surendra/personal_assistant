"""
SettingsUpdateCommand requires settings_id/user_id/workspace_id directly in
the body (the controller asserts command.user_id matches the auth token
rather than filling it in itself). The real frontend satisfies this
incidentally -- SettingsPage.js merges the GET response (which includes
all three) into local state before ever calling update -- so tests send
them explicitly here to match what the API actually requires.
"""
from fastapi import status


def test_get_settings_returns_defaults_for_fresh_workspace(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    resp = client.get(f"/api/v1/workspaces/{workspace_id}/settings/", headers=headers)
    assert resp.status_code == status.HTTP_200_OK, resp.text
    assert resp.json()["language"] == "en"


def test_update_settings_persists_changes(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    user_id = signed_up_user["user_id"]
    headers = signed_up_user["headers"]

    settings_id = client.get(f"/api/v1/workspaces/{workspace_id}/settings/", headers=headers).json()["settings_id"]

    updated = client.put(
        f"/api/v1/workspaces/{workspace_id}/settings/{settings_id}",
        headers=headers,
        json={
            "settings_id": settings_id,
            "user_id": user_id,
            "workspace_id": workspace_id,
            "language": "es",
            "theme": "dark",
            "weekly_digest": False,
        },
    )
    assert updated.status_code == status.HTTP_200_OK, updated.text
    body = updated.json()
    assert body["language"] == "es"
    assert body["theme"] == "dark"
    assert body["weekly_digest"] is False

    refetched = client.get(f"/api/v1/workspaces/{workspace_id}/settings/", headers=headers)
    assert refetched.json()["language"] == "es"
