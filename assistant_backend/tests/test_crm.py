import pytest
from fastapi import status
from datetime import datetime, timedelta

# Test data
TEST_ACTIVITY = {
    "type": "call",
    "description": "Follow-up call with client",
    "notes": "Discuss project timeline",
    "date": (datetime.now() + timedelta(days=1)).isoformat(),
    "tags": ["follow-up", "client"],
    "contact_id": None,  # Will be set after creating a contact
    "deal_id": None     # Will be set after creating a deal
}

TEST_CONTACT = {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Test Company",
    "job_title": "CEO"
}

TEST_DEAL = {
    "name": "Test Deal",
    "value": 10000,
    "stage": "proposal",
    "status": "in progress",
    "probability": 75,
    "contact_id": None  # Will be set after creating a contact
}

@pytest.mark.asyncio
async def test_create_and_get_activity(client):
    # First create a user and get token
    user_response = client.post("/api/v1/users/", json={
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    })
    assert user_response.status_code == status.HTTP_201_CREATED

    login_response = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "testpassword123"
    })
    assert login_response.status_code == status.HTTP_200_OK
    token = login_response.json()["access_token"]

    # Create a contact first
    contact_response = client.post(
        "/api/crm/contacts/",
        json=TEST_CONTACT,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert contact_response.status_code == status.HTTP_201_CREATED
    contact_id = contact_response.json()["contact_id"]

    # Create a deal
    TEST_DEAL["contact_id"] = contact_id
    deal_response = client.post(
        "/api/crm/deals/",
        json=TEST_DEAL,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert deal_response.status_code == status.HTTP_201_CREATED
    deal_id = deal_response.json()["deal_id"]

    # Create an activity
    TEST_ACTIVITY["contact_id"] = contact_id
    TEST_ACTIVITY["deal_id"] = deal_id
    activity_response = client.post(
        "/api/crm/activities/",
        json=TEST_ACTIVITY,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert activity_response.status_code == status.HTTP_201_CREATED
    activity_data = activity_response.json()
    assert activity_data["type"] == TEST_ACTIVITY["type"]
    assert activity_data["description"] == TEST_ACTIVITY["description"]
    assert "activity_id" in activity_data

    # Get the activity
    get_response = client.get(
        f"/api/crm/activities/{activity_data['activity_id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_response.status_code == status.HTTP_200_OK
    get_data = get_response.json()
    assert get_data["activity_id"] == activity_data["activity_id"]
    assert get_data["type"] == TEST_ACTIVITY["type"]
    assert get_data["description"] == TEST_ACTIVITY["description"]
    assert get_data["contact_id"] == contact_id
    assert get_data["deal_id"] == deal_id

    # Get all activities
    list_response = client.get(
        "/api/crm/activities/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert list_response.status_code == status.HTTP_200_OK
    list_data = list_response.json()
    assert isinstance(list_data, list)
    assert len(list_data) > 0
    assert any(a["activity_id"] == activity_data["activity_id"] for a in list_data) 