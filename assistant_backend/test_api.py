import pytest
from fastapi import status
from app.schemas import UserCreate, TaskCreate, NoteCreate

# Test data
TEST_USER = {
    "email": "test@example.com",
    "password": "testpassword123",
    "full_name": "Test User"
}

TEST_TASK = {
    "title": "Test Task",
    "description": "This is a test task",
    "status": "pending"
}

TEST_NOTE = {
    "title": "Test Note",
    "content": "This is a test note"
}

@pytest.mark.asyncio
async def test_create_user(client):
    response = client.post("/api/users/", json=TEST_USER)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == TEST_USER["email"]
    assert "id" in data
    assert "password" not in data

@pytest.mark.asyncio
async def test_login_user(client):
    # First create a user
    client.post("/api/users/", json=TEST_USER)
    
    # Then try to login
    response = client.post("/api/auth/login", data={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_create_task(client):
    # First create a user and get token
    client.post("/api/users/", json=TEST_USER)
    login_response = client.post("/api/auth/login", data={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    token = login_response.json()["access_token"]
    
    # Create task with auth token
    response = client.post(
        "/api/tasks/",
        json=TEST_TASK,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == TEST_TASK["title"]
    assert "id" in data

@pytest.mark.asyncio
async def test_create_note(client):
    # First create a user and get token
    client.post("/api/users/", json=TEST_USER)
    login_response = client.post("/api/auth/login", data={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    token = login_response.json()["access_token"]
    
    # Create note with auth token
    response = client.post(
        "/api/notes/",
        json=TEST_NOTE,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == TEST_NOTE["title"]
    assert "id" in data

@pytest.mark.asyncio
async def test_get_user_tasks(client):
    # First create a user and get token
    client.post("/api/users/", json=TEST_USER)
    login_response = client.post("/api/auth/login", data={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    token = login_response.json()["access_token"]
    
    # Create a task
    client.post(
        "/api/tasks/",
        json=TEST_TASK,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Get user's tasks
    response = client.get(
        "/api/tasks/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["title"] == TEST_TASK["title"]

@pytest.mark.asyncio
async def test_get_user_notes(client):
    # First create a user and get token
    client.post("/api/users/", json=TEST_USER)
    login_response = client.post("/api/auth/login", data={
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    })
    token = login_response.json()["access_token"]
    
    # Create a note
    client.post(
        "/api/notes/",
        json=TEST_NOTE,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Get user's notes
    response = client.get(
        "/api/notes/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["title"] == TEST_NOTE["title"] 