"""Backend tests for LinkChat"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://infra-boost-creative.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


def _signup(name=None, email=None, password="pass1234"):
    email = email or f"TEST_{uuid.uuid4().hex[:8]}@test.com"
    name = name or "Test User"
    r = requests.post(f"{API}/auth/signup", json={"name": name, "email": email, "password": password})
    assert r.status_code == 200, r.text
    data = r.json()
    return data["token"], data["user"], email, password


@pytest.fixture(scope="module")
def user_a():
    token, user, email, pwd = _signup(name="Alice T")
    return {"token": token, "user": user, "email": email, "password": pwd,
            "headers": {"Authorization": f"Bearer {token}"}}


@pytest.fixture(scope="module")
def user_b():
    token, user, email, pwd = _signup(name="Bob T")
    return {"token": token, "user": user, "email": email, "password": pwd,
            "headers": {"Authorization": f"Bearer {token}"}}


# -------------------- Auth --------------------
class TestAuth:
    def test_signup_login_me(self, user_a):
        assert user_a["user"]["email"] == user_a["email"].lower()
        # login
        r = requests.post(f"{API}/auth/login", json={"email": user_a["email"], "password": user_a["password"]})
        assert r.status_code == 200
        assert "token" in r.json()
        # me
        r = requests.get(f"{API}/auth/me", headers=user_a["headers"])
        assert r.status_code == 200
        assert r.json()["email"] == user_a["email"].lower()
        assert r.json()["online"] is True

    def test_login_wrong_password(self, user_a):
        r = requests.post(f"{API}/auth/login", json={"email": user_a["email"], "password": "wrongpass"})
        assert r.status_code == 401

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_signup_duplicate(self, user_a):
        r = requests.post(f"{API}/auth/signup", json={"name": "x", "email": user_a["email"], "password": "pass1234"})
        assert r.status_code == 400

    def test_google_session_missing(self):
        r = requests.post(f"{API}/auth/google/session")
        assert r.status_code == 400

    def test_google_session_invalid(self):
        r = requests.post(f"{API}/auth/google/session", headers={"X-Session-ID": "invalid-xxx"})
        assert r.status_code == 401


# -------------------- Profile --------------------
class TestProfile:
    def test_update_profile(self, user_a):
        r = requests.put(f"{API}/profile", headers=user_a["headers"],
                         json={"name": "Alice Updated", "status": "coding"})
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "Alice Updated"
        assert d["status"] == "coding"
        # verify persisted
        me = requests.get(f"{API}/auth/me", headers=user_a["headers"]).json()
        assert me["name"] == "Alice Updated"


# -------------------- Servers / Channels --------------------
class TestServers:
    def test_create_server_with_default_channels(self, user_a):
        r = requests.post(f"{API}/servers", headers=user_a["headers"], json={"name": "TEST_Server"})
        assert r.status_code == 200
        server = r.json()
        assert server["name"] == "TEST_Server"
        assert "invite_code" in server
        assert user_a["user"]["user_id"] in server["members"]
        user_a["server"] = server
        # detail
        r = requests.get(f"{API}/servers/{server['server_id']}", headers=user_a["headers"])
        assert r.status_code == 200
        detail = r.json()
        ch_names = sorted([c["name"] for c in detail["channels"]])
        assert "geral" in ch_names and "random" in ch_names
        geral = next(c for c in detail["channels"] if c["name"] == "geral")
        user_a["geral_id"] = geral["channel_id"]

    def test_list_servers_only_mine(self, user_a, user_b):
        a = requests.get(f"{API}/servers", headers=user_a["headers"]).json()
        b = requests.get(f"{API}/servers", headers=user_b["headers"]).json()
        a_ids = [s["server_id"] for s in a]
        b_ids = [s["server_id"] for s in b]
        assert user_a["server"]["server_id"] in a_ids
        assert user_a["server"]["server_id"] not in b_ids

    def test_non_member_forbidden(self, user_a, user_b):
        r = requests.get(f"{API}/servers/{user_a['server']['server_id']}", headers=user_b["headers"])
        assert r.status_code == 403

    def test_join_invalid_code(self, user_b):
        r = requests.post(f"{API}/servers/join", headers=user_b["headers"], json={"invite_code": "nope-xyz"})
        assert r.status_code == 404

    def test_join_with_code(self, user_a, user_b):
        code = user_a["server"]["invite_code"]
        r = requests.post(f"{API}/servers/join", headers=user_b["headers"], json={"invite_code": code})
        assert r.status_code == 200
        # bob now member
        r = requests.get(f"{API}/servers/{user_a['server']['server_id']}", headers=user_b["headers"])
        assert r.status_code == 200

    def test_create_channel(self, user_a):
        r = requests.post(f"{API}/servers/{user_a['server']['server_id']}/channels",
                          headers=user_a["headers"], json={"name": "dev"})
        assert r.status_code == 200
        assert r.json()["name"] == "dev"


# -------------------- Messages --------------------
@pytest.fixture(scope="class")
def msg_ctx(user_a):
    r = requests.post(f"{API}/servers", headers=user_a["headers"], json={"name": "TEST_MsgServer"})
    assert r.status_code == 200
    srv = r.json()
    d = requests.get(f"{API}/servers/{srv['server_id']}", headers=user_a["headers"]).json()
    geral = next(c for c in d["channels"] if c["name"] == "geral")
    return {"geral_id": geral["channel_id"]}


class TestMessages:
    def test_post_and_get_message(self, user_a, msg_ctx):
        ch = msg_ctx["geral_id"]
        r = requests.post(f"{API}/channels/{ch}/messages", headers=user_a["headers"],
                          json={"content": "Hello world"})
        assert r.status_code == 200
        assert r.json()["content"] == "Hello world"
        assert r.json()["author"]["user_id"] == user_a["user"]["user_id"]
        # fetch
        r = requests.get(f"{API}/channels/{ch}/messages", headers=user_a["headers"])
        assert r.status_code == 200
        msgs = r.json()
        assert any(m["content"] == "Hello world" for m in msgs)
        assert msgs[-1]["author"] is not None

    def test_image_attachment(self, user_a, msg_ctx):
        ch = msg_ctx["geral_id"]
        img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        r = requests.post(f"{API}/channels/{ch}/messages", headers=user_a["headers"],
                          json={"content": "pic", "image": img, "file_name": "test.png"})
        assert r.status_code == 200
        assert r.json()["image"] == img

    def test_empty_message_rejected(self, user_a, msg_ctx):
        ch = msg_ctx["geral_id"]
        r = requests.post(f"{API}/channels/{ch}/messages", headers=user_a["headers"], json={"content": ""})
        assert r.status_code == 400


# -------------------- DMs --------------------
class TestDM:
    def test_all_users(self, user_a, user_b):
        r = requests.get(f"{API}/dm/all-users", headers=user_a["headers"])
        assert r.status_code == 200
        ids = [u["user_id"] for u in r.json()]
        assert user_b["user"]["user_id"] in ids
        assert user_a["user"]["user_id"] not in ids

    def test_dm_send_and_read_both_sides(self, user_a, user_b):
        other = user_b["user"]["user_id"]
        r = requests.post(f"{API}/dm/{other}/messages", headers=user_a["headers"],
                          json={"content": "hi bob"})
        assert r.status_code == 200
        # A reads
        ra = requests.get(f"{API}/dm/{other}/messages", headers=user_a["headers"]).json()
        # B reads from their side using A's id
        rb = requests.get(f"{API}/dm/{user_a['user']['user_id']}/messages", headers=user_b["headers"]).json()
        assert any(m["content"] == "hi bob" for m in ra)
        assert any(m["content"] == "hi bob" for m in rb)

    def test_dm_user_not_found(self, user_a):
        r = requests.post(f"{API}/dm/user_doesnotexist/messages", headers=user_a["headers"],
                          json={"content": "hey"})
        assert r.status_code == 404
