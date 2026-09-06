from fastapi import status


def test_partial_profile_update_does_not_require_all_fields(client, signed_up_user):
    user_id = signed_up_user["user_id"]
    headers = signed_up_user["headers"]

    resp = client.put(
        f"/api/v1/users/{user_id}",
        headers=headers,
        json={"first_name": "Updated"},
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    assert resp.json()["first_name"] == "Updated"
    assert "password_hash" not in resp.json()


def test_update_bio_and_fetch_via_me(client, signed_up_user):
    user_id = signed_up_user["user_id"]
    headers = signed_up_user["headers"]

    resp = client.put(
        f"/api/v1/users/{user_id}",
        headers=headers,
        json={"bio": "Building things."},
    )
    assert resp.status_code == status.HTTP_200_OK, resp.text
    assert resp.json()["bio"] == "Building things."

    me = client.get("/api/v1/users/me", headers=headers)
    assert me.json()["bio"] == "Building things."


def test_cannot_update_another_users_profile(client, signed_up_user):
    headers = signed_up_user["headers"]
    resp = client.put(
        "/api/v1/users/00000000-0000-0000-0000-000000000000",
        headers=headers,
        json={"first_name": "Nope"},
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN
