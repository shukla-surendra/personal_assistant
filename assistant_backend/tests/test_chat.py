"""
Covers chat/message CRUD only -- POST .../completion calls out to a real
OpenAI-backed agent (core/agent.py), which needs a live API key and isn't
something a unit/integration test should depend on.
"""
from fastapi import status


def test_chat_and_message_crud(client, signed_up_user):
    workspace_id = signed_up_user["workspace_id"]
    headers = signed_up_user["headers"]

    chat = client.post(
        f"/api/v1/workspaces/{workspace_id}/chats/",
        headers=headers,
        json={"title": "Project kickoff"},
    )
    assert chat.status_code == status.HTTP_201_CREATED, chat.text
    chat_id = chat.json()["chat_id"]

    listed = client.get(f"/api/v1/workspaces/{workspace_id}/chats/", headers=headers)
    assert chat_id in [c["chat_id"] for c in listed.json()]

    message = client.post(
        f"/api/v1/workspaces/{workspace_id}/chats/{chat_id}/messages",
        headers=headers,
        json={"content": "Hello", "role": "user"},
    )
    assert message.status_code == status.HTTP_201_CREATED, message.text
    message_id = message.json()["message_id"]

    messages = client.get(f"/api/v1/workspaces/{workspace_id}/chats/{chat_id}/messages", headers=headers)
    assert message_id in [m["message_id"] for m in messages.json()]

    updated_message = client.put(
        f"/api/v1/workspaces/{workspace_id}/chats/{chat_id}/messages/{message_id}",
        headers=headers,
        json={"content": "Hello, edited"},
    )
    assert updated_message.status_code == status.HTTP_200_OK, updated_message.text
    assert updated_message.json()["content"] == "Hello, edited"

    deleted_chat = client.delete(f"/api/v1/workspaces/{workspace_id}/chats/{chat_id}", headers=headers)
    assert deleted_chat.status_code == status.HTTP_204_NO_CONTENT
