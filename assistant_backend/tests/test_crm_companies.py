from fastapi import status


def test_company_crud_and_contact_rollup(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    company = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/companies",
        headers=headers,
        json={"workspace_id": workspace_id, "name": "Acme Corp", "industry": "Software"},
    )
    assert company.status_code == status.HTTP_200_OK, company.text
    company_id = company.json()["company_id"]

    contact = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts",
        headers=headers,
        json={"workspace_id": workspace_id, "first_name": "Jane", "last_name": "Doe", "company_id": company_id},
    )
    assert contact.status_code == status.HTTP_200_OK, contact.text
    assert contact.json()["company_ref"]["name"] == "Acme Corp"

    rollup = client.get(f"/api/v1/workspaces/{workspace_id}/crm/companies/{company_id}/contacts", headers=headers)
    assert rollup.status_code == status.HTTP_200_OK, rollup.text
    assert [c["first_name"] for c in rollup.json()] == ["Jane"]

    updated = client.put(
        f"/api/v1/workspaces/{workspace_id}/crm/companies/{company_id}",
        headers=headers,
        json={"industry": "Fintech"},
    )
    assert updated.status_code == status.HTTP_200_OK, updated.text
    assert updated.json()["industry"] == "Fintech"

    deleted = client.delete(f"/api/v1/workspaces/{workspace_id}/crm/companies/{company_id}", headers=headers)
    assert deleted.status_code == status.HTTP_200_OK, deleted.text

    # Deleting a company unlinks its contacts rather than deleting them.
    refreshed_contact = client.get(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts/{contact.json()['contact_id']}", headers=headers
    )
    assert refreshed_contact.json()["company_id"] is None


def test_deal_partial_update_for_pipeline_drag(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    contact_id = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts",
        headers=headers,
        json={"workspace_id": workspace_id, "first_name": "Bob", "last_name": "Smith"},
    ).json()["contact_id"]

    deal = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/deals",
        headers=headers,
        json={"workspace_id": workspace_id, "contact_id": contact_id, "title": "Big Deal", "stage": "new"},
    )
    assert deal.status_code == status.HTTP_200_OK, deal.text
    deal_id = deal.json()["deal_id"]

    # A drag-and-drop move only sends stage + order -- must not require
    # title/stage to be resent (that was the pre-fix bug).
    moved = client.put(
        f"/api/v1/workspaces/{workspace_id}/crm/deals/{deal_id}",
        headers=headers,
        json={"stage": "proposal", "order": 0},
    )
    assert moved.status_code == status.HTTP_200_OK, moved.text
    assert moved.json()["stage"] == "proposal"
    assert moved.json()["title"] == "Big Deal"
