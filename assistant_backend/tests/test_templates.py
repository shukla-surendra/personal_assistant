from fastapi import status


def test_template_crud(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    created = client.post(
        f"/api/v1/workspaces/{workspace_id}/templates/",
        headers=headers,
        json={"title": "Bug Report", "icon": "bug", "content": {"body": "Steps to reproduce"}},
    )
    assert created.status_code == status.HTTP_201_CREATED, created.text
    template = created.json()
    template_id = template["template_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/templates/", headers=headers)
    assert template_id in [t["template_id"] for t in listed.json()]

    updated = client.put(
        f"/api/v1/workspaces/{workspace_id}/templates/{template_id}",
        headers=headers,
        json={"title": "Bug Report v2"},
    )
    assert updated.status_code == status.HTTP_200_OK, updated.text
    assert updated.json()["title"] == "Bug Report v2"

    deleted = client.delete(f"/api/v1/workspaces/{workspace_id}/templates/{template_id}", headers=headers)
    assert deleted.status_code == status.HTTP_204_NO_CONTENT

    after_delete = client.get(f"/api/v1/workspaces/{workspace_id}/templates/{template_id}", headers=headers)
    assert after_delete.status_code == status.HTTP_404_NOT_FOUND
