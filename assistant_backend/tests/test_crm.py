"""
CRM flow: contact -> deal -> contact activity. Real paths (all nested under
/api/v1/workspaces/{workspace_id}/crm/...) and real payload shapes, verified
against commands/crm_cmd.py and controllers/crm_controller.py -- the
original version of this file used /api/crm/* paths and a generic
/api/crm/activities/ list endpoint that don't exist anywhere in this app.

Unlike tasks/boards, ContactActivityCreate's workspace_id/user_id are NOT
filled in by the controller from the URL/auth token -- the client has to
supply them directly. Kept as-is here since this is a test of what the API
actually requires, not a place to silently paper over that inconsistency.
"""
from fastapi import status


def test_create_contact(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    resp = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts",
        headers=signed_up_user["headers"],
        json={
            "workspace_id": workspace_id,
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+1234567890",
            "company": "Test Company",
            "job_title": "CEO",
        },
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    body = resp.json()
    assert body["first_name"] == "John"
    assert body["workspace_id"] == workspace_id


def test_list_contacts_includes_created_one(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    created = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts",
        headers=headers,
        json={
            "workspace_id": workspace_id,
            "first_name": "Jane",
            "last_name": "Smith",
        },
    )
    assert created.status_code == status.HTTP_200_OK, created.text
    contact_id = created.json()["contact_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/crm/contacts", headers=headers)
    assert listed.status_code == status.HTTP_200_OK, listed.text
    ids = [c["contact_id"] for c in listed.json()]
    assert contact_id in ids


def test_create_deal_for_contact(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    contact = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts",
        headers=headers,
        json={"workspace_id": workspace_id, "first_name": "Deal", "last_name": "Contact"},
    ).json()

    resp = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/deals",
        headers=headers,
        json={
            "workspace_id": workspace_id,
            "contact_id": contact["contact_id"],
            "title": "Test Deal",
            "value": 10000,
            "stage": "proposal",
            "probability": 75,
        },
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    deal = resp.json()
    assert deal["title"] == "Test Deal"
    assert deal["contact_id"] == contact["contact_id"]


def test_create_and_list_contact_activity(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    user_id = signed_up_user["user_id"]
    headers = signed_up_user["headers"]

    contact = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts",
        headers=headers,
        json={"workspace_id": workspace_id, "first_name": "Activity", "last_name": "Contact"},
    ).json()
    contact_id = contact["contact_id"]

    activity = client.post(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts/{contact_id}/activities",
        headers=headers,
        json={
            "workspace_id": workspace_id,
            "contact_id": contact_id,
            "user_id": user_id,
            "type": "call",
            "title": "Follow-up call",
            "description": "Discuss project timeline",
        },
    )
    assert activity.status_code == status.HTTP_200_OK, activity.text
    assert activity.json()["title"] == "Follow-up call"

    listed = client.get(
        f"/api/v1/workspaces/{workspace_id}/crm/contacts/{contact_id}/activities",
        headers=headers,
    )
    assert listed.status_code == status.HTTP_200_OK, listed.text
    assert len(listed.json()) >= 1
