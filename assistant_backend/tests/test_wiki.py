from fastapi import status


def test_page_and_block_crud(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    page = client.post(
        f"/api/v1/workspaces/{workspace_id}/pages/",
        headers=headers,
        json={"title": "Runbook"},
    )
    assert page.status_code == status.HTTP_201_CREATED, page.text
    page_id = page.json()["page_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/pages/", headers=headers)
    assert page_id in [p["page_id"] for p in listed.json()]

    updated = client.put(
        f"/api/v1/workspaces/{workspace_id}/pages/{page_id}",
        headers=headers,
        json={"title": "Updated Runbook"},
    )
    assert updated.status_code == status.HTTP_200_OK, updated.text
    assert updated.json()["title"] == "Updated Runbook"

    block = client.post(
        f"/api/v1/workspaces/{workspace_id}/pages/{page_id}/blocks",
        headers=headers,
        json={"type": "paragraph", "content": {"text": "Hello world"}, "order": 0},
    )
    assert block.status_code == status.HTTP_201_CREATED, block.text
    block_id = block.json()["block_id"]

    blocks = client.get(f"/api/v1/workspaces/{workspace_id}/pages/{page_id}/blocks", headers=headers)
    assert block_id in [b["block_id"] for b in blocks.json()]

    deleted_block = client.delete(
        f"/api/v1/workspaces/{workspace_id}/pages/{page_id}/blocks/{block_id}", headers=headers
    )
    assert deleted_block.status_code == status.HTTP_204_NO_CONTENT

    deleted_page = client.delete(f"/api/v1/workspaces/{workspace_id}/pages/{page_id}", headers=headers)
    assert deleted_page.status_code == status.HTTP_204_NO_CONTENT

    after_delete = client.get(f"/api/v1/workspaces/{workspace_id}/pages/{page_id}", headers=headers)
    assert after_delete.status_code == status.HTTP_404_NOT_FOUND
