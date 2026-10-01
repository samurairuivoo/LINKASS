"""Backend tests for new LinkChat features: upload, typing, reactions, voice."""
import io
import os
import time
import uuid
import pytest
import requests

BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL') or 'https://infra-boost-creative.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


def _signup(name="Test User"):
    email = f"TEST_{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{API}/auth/signup", json={"name": name, "email": email, "password": "pass1234"})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"], "email": email,
            "headers": {"Authorization": f"Bearer {d['token']}"}}


@pytest.fixture(scope="module")
def alice():
    return _signup("Alice NF")


@pytest.fixture(scope="module")
def bob():
    return _signup("Bob NF")


@pytest.fixture(scope="module")
def ctx(alice, bob):
    # Alice creates a server + voice channel; Bob joins
    r = requests.post(f"{API}/servers", headers=alice["headers"], json={"name": "TEST_NFServer"})
    srv = r.json()
    d = requests.get(f"{API}/servers/{srv['server_id']}", headers=alice["headers"]).json()
    text_ch = next(c for c in d["channels"] if c["name"] == "geral")["channel_id"]
    # Create a voice channel
    r = requests.post(f"{API}/servers/{srv['server_id']}/channels", headers=alice["headers"],
                      json={"name": "voz", "type": "voice"})
    assert r.status_code == 200
    voice_ch = r.json()["channel_id"]
    assert r.json()["type"] == "voice"
    # Bob joins server via invite
    code = srv["invite_code"]
    r = requests.post(f"{API}/servers/join", headers=bob["headers"], json={"invite_code": code})
    assert r.status_code == 200
    return {"server_id": srv["server_id"], "text_ch": text_ch, "voice_ch": voice_ch,
            "invite_code": code}


# -------------------- Upload --------------------
class TestUpload:
    def test_upload_requires_auth(self):
        files = {"file": ("x.txt", b"hello", "text/plain")}
        r = requests.post(f"{API}/upload", files=files)
        assert r.status_code == 401

    def test_upload_and_download(self, alice):
        content = b"\x89PNG\r\n\x1a\nFAKEIMG"
        files = {"file": ("pic.png", content, "image/png")}
        r = requests.post(f"{API}/upload", files=files, headers=alice["headers"])
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["is_image"] is True
        assert d["file_name"] == "pic.png"
        assert d["file_type"].startswith("image/")
        assert d["url"].startswith("/api/files/")
        # fetch (public GET)
        r2 = requests.get(f"{BASE_URL}{d['url']}")
        assert r2.status_code == 200
        assert "image" in r2.headers.get("content-type", "")

    def test_upload_non_image(self, alice):
        files = {"file": ("note.txt", b"hello world", "text/plain")}
        r = requests.post(f"{API}/upload", files=files, headers=alice["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d["is_image"] is False


# -------------------- Message attachments & empty rejection --------------------
class TestMessageAttachments:
    def test_message_with_file_url(self, alice, ctx):
        payload = {"content": "", "file_url": "/api/files/x/y.pdf",
                   "file_name": "y.pdf", "file_type": "application/pdf"}
        r = requests.post(f"{API}/channels/{ctx['text_ch']}/messages",
                          headers=alice["headers"], json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["file_url"] == payload["file_url"]
        assert d["file_name"] == "y.pdf"

    def test_message_empty_rejected(self, alice, ctx):
        r = requests.post(f"{API}/channels/{ctx['text_ch']}/messages",
                          headers=alice["headers"], json={"content": ""})
        assert r.status_code == 400


# -------------------- Reactions --------------------
class TestReactions:
    def test_channel_react_toggle(self, alice, ctx):
        r = requests.post(f"{API}/channels/{ctx['text_ch']}/messages",
                          headers=alice["headers"], json={"content": "react me"})
        mid = r.json()["message_id"]
        # Add
        r = requests.post(f"{API}/messages/{mid}/react", headers=alice["headers"],
                          json={"emoji": "👍"})
        assert r.status_code == 200
        rx = r.json()["reactions"]
        assert alice["user"]["user_id"] in rx.get("👍", [])
        # Remove
        r = requests.post(f"{API}/messages/{mid}/react", headers=alice["headers"],
                          json={"emoji": "👍"})
        assert r.status_code == 200
        assert "👍" not in r.json()["reactions"]

    def test_dm_react(self, alice, bob):
        r = requests.post(f"{API}/dm/{bob['user']['user_id']}/messages",
                          headers=alice["headers"], json={"content": "hey"})
        mid = r.json()["message_id"]
        r = requests.post(f"{API}/messages/{mid}/react", headers=bob["headers"],
                          json={"emoji": "❤️"})
        assert r.status_code == 200
        assert bob["user"]["user_id"] in r.json()["reactions"]["❤️"]

    def test_react_invalid_message(self, alice):
        r = requests.post(f"{API}/messages/nope123/react", headers=alice["headers"],
                          json={"emoji": "🔥"})
        assert r.status_code == 404


# -------------------- Typing --------------------
class TestTyping:
    def test_typing_flow(self, alice, bob, ctx):
        room = ctx["text_ch"]
        # Alice types
        r = requests.post(f"{API}/typing", headers=alice["headers"], json={"room": room})
        assert r.status_code == 200
        # Bob fetches typing - sees Alice
        r = requests.get(f"{API}/typing/{room}", headers=bob["headers"])
        assert r.status_code == 200
        users = r.json()
        assert any(u["user_id"] == alice["user"]["user_id"] for u in users)
        # Alice fetches typing - excludes self
        r = requests.get(f"{API}/typing/{room}", headers=alice["headers"])
        assert all(u["user_id"] != alice["user"]["user_id"] for u in r.json())

    def test_typing_cleared_on_send(self, alice, bob, ctx):
        room = ctx["text_ch"]
        requests.post(f"{API}/typing", headers=alice["headers"], json={"room": room})
        # Alice sends a message
        requests.post(f"{API}/channels/{room}/messages", headers=alice["headers"],
                      json={"content": "done typing"})
        r = requests.get(f"{API}/typing/{room}", headers=bob["headers"]).json()
        assert all(u["user_id"] != alice["user"]["user_id"] for u in r)


# -------------------- Voice --------------------
class TestVoice:
    def test_voice_join_requires_membership(self, ctx):
        stranger = _signup("Stranger NF")
        r = requests.post(f"{API}/channels/{ctx['voice_ch']}/voice/join",
                          headers=stranger["headers"])
        assert r.status_code == 403

    def test_voice_join_and_participants(self, alice, bob, ctx):
        r = requests.post(f"{API}/channels/{ctx['voice_ch']}/voice/join",
                          headers=alice["headers"])
        assert r.status_code == 200
        ids = [p["user_id"] for p in r.json()]
        assert alice["user"]["user_id"] in ids
        # Bob joins
        r = requests.post(f"{API}/channels/{ctx['voice_ch']}/voice/join",
                          headers=bob["headers"])
        assert r.status_code == 200
        # GET participants
        r = requests.get(f"{API}/channels/{ctx['voice_ch']}/voice/participants",
                         headers=alice["headers"])
        ids = [p["user_id"] for p in r.json()]
        assert alice["user"]["user_id"] in ids
        assert bob["user"]["user_id"] in ids

    def test_voice_leave(self, bob, ctx):
        r = requests.post(f"{API}/channels/{ctx['voice_ch']}/voice/leave",
                          headers=bob["headers"])
        assert r.status_code == 200
        r = requests.get(f"{API}/channels/{ctx['voice_ch']}/voice/participants",
                         headers=bob["headers"])
        ids = [p["user_id"] for p in r.json()]
        assert bob["user"]["user_id"] not in ids

    def test_voice_signal_flow(self, alice, bob, ctx):
        # Alice sends signal to Bob
        r = requests.post(f"{API}/voice/signal", headers=alice["headers"], json={
            "channel_id": ctx["voice_ch"], "to": bob["user"]["user_id"],
            "type": "offer", "payload": {"sdp": "fake"}
        })
        assert r.status_code == 200
        # Bob reads signals -> consumes
        r = requests.get(f"{API}/voice/signals?channel_id={ctx['voice_ch']}",
                         headers=bob["headers"])
        assert r.status_code == 200
        sigs = r.json()
        assert any(s["type"] == "offer" and s["from"] == alice["user"]["user_id"] for s in sigs)
        # Second fetch should be empty (consumed)
        r = requests.get(f"{API}/voice/signals?channel_id={ctx['voice_ch']}",
                         headers=bob["headers"])
        assert r.json() == []


# -------------------- Invite flow re-verify --------------------
class TestInvite:
    def test_join_invalid(self, alice):
        r = requests.post(f"{API}/servers/join", headers=alice["headers"],
                          json={"invite_code": "doesnotexist-xyz"})
        assert r.status_code == 404

    def test_join_valid(self, ctx):
        stranger = _signup("Joiner NF")
        r = requests.post(f"{API}/servers/join", headers=stranger["headers"],
                          json={"invite_code": ctx["invite_code"]})
        assert r.status_code == 200
        assert r.json()["server_id"] == ctx["server_id"]
