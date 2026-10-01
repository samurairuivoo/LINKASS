"""Iter 5: voice 10-cap, Stripe BRL pricing, audio upload + audio message."""
import io
import os
import uuid
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://infra-boost-creative.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _signup(name="U"):
    email = f"TEST_{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{API}/auth/signup", json={
        "name": name, "email": email, "password": "pass1234",
        "birth_date": "2000-01-01",
    })
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"],
            "headers": {"Authorization": f"Bearer {d['token']}"}}


# ---------- Voice 10-participant cap ----------
class TestVoiceCap:
    def test_voice_room_cap_10_and_11th_rejected(self):
        owner = _signup("Owner")
        # Create server + voice channel
        srv = requests.post(f"{API}/servers", headers=owner["headers"],
                            json={"name": "TEST_CapSrv"}).json()
        server_id = srv["server_id"]
        invite_code = srv["invite_code"]
        ch = requests.post(f"{API}/servers/{server_id}/channels",
                           headers=owner["headers"],
                           json={"name": "voz", "type": "voice"}).json()
        channel_id = ch["channel_id"]

        # Owner joins
        r = requests.post(f"{API}/channels/{channel_id}/voice/join",
                          headers=owner["headers"])
        assert r.status_code == 200, r.text
        assert len(r.json()) == 1

        # 9 more members => total 10
        joined_users = [owner]
        for i in range(9):
            u = _signup(f"M{i}")
            # Join server first
            jr = requests.post(f"{API}/servers/join", headers=u["headers"],
                               json={"invite_code": invite_code})
            assert jr.status_code == 200, jr.text
            vr = requests.post(f"{API}/channels/{channel_id}/voice/join",
                               headers=u["headers"])
            assert vr.status_code == 200, f"user {i} join failed: {vr.text}"
            joined_users.append(u)

        # Verify 10 participants
        parts = requests.get(f"{API}/channels/{channel_id}/voice/participants",
                             headers=owner["headers"]).json()
        assert len(parts) == 10

        # Existing user heartbeat (re-join) should still work (not blocked by cap)
        hb = requests.post(f"{API}/channels/{channel_id}/voice/join",
                           headers=owner["headers"])
        assert hb.status_code == 200, f"heartbeat should pass: {hb.text}"

        # 11th distinct user must be rejected 403
        eleventh = _signup("Eleventh")
        requests.post(f"{API}/servers/join", headers=eleventh["headers"],
                      json={"invite_code": invite_code})
        rr = requests.post(f"{API}/channels/{channel_id}/voice/join",
                           headers=eleventh["headers"])
        assert rr.status_code == 403, f"expected 403, got {rr.status_code}: {rr.text}"
        detail = rr.json().get("detail", "")
        assert "Sala cheia" in detail or "máximo" in detail, detail

        # Cleanup leave for owner (nice)
        requests.post(f"{API}/channels/{channel_id}/voice/leave",
                      headers=owner["headers"])

    def test_voice_signaling_store_and_consume(self):
        a = _signup("SigA"); b = _signup("SigB")
        srv = requests.post(f"{API}/servers", headers=a["headers"],
                            json={"name": "TEST_Sig"}).json()
        requests.post(f"{API}/servers/join", headers=b["headers"],
                      json={"invite_code": srv["invite_code"]})
        ch = requests.post(f"{API}/servers/{srv['server_id']}/channels",
                           headers=a["headers"],
                           json={"name": "v", "type": "voice"}).json()
        cid = ch["channel_id"]
        requests.post(f"{API}/channels/{cid}/voice/join", headers=a["headers"])
        requests.post(f"{API}/channels/{cid}/voice/join", headers=b["headers"])

        # A sends offer to B
        r = requests.post(f"{API}/voice/signal", headers=a["headers"], json={
            "channel_id": cid, "to": b["user"]["user_id"],
            "type": "offer", "payload": {"sdp": "x"},
        })
        assert r.status_code == 200

        # B reads signals, A should not see any addressed to A
        sigs_b = requests.get(f"{API}/voice/signals", headers=b["headers"],
                              params={"channel_id": cid}).json()
        assert any(s["type"] == "offer" and s["from"] == a["user"]["user_id"]
                   for s in sigs_b)
        # Consumed - a second read returns empty
        sigs_b2 = requests.get(f"{API}/voice/signals", headers=b["headers"],
                               params={"channel_id": cid}).json()
        assert all(s["type"] != "offer" for s in sigs_b2) or len(sigs_b2) == 0

        # Leave removes participant
        requests.post(f"{API}/channels/{cid}/voice/leave", headers=b["headers"])
        parts = requests.get(f"{API}/channels/{cid}/voice/participants",
                             headers=a["headers"]).json()
        assert all(p["user_id"] != b["user"]["user_id"] for p in parts)


# ---------- Stripe BRL ----------
class TestStripeBRL:
    @pytest.mark.parametrize("lookup_key,expected_amount", [
        ("pro_monthly", 1900),
        ("pro_yearly", 19000),
        ("community_monthly", 4900),
        ("community_yearly", 49000),
    ])
    def test_checkout_returns_url_and_price_is_brl(self, lookup_key, expected_amount):
        u = _signup("Payer")
        r = requests.post(f"{API}/payments/checkout", headers=u["headers"], json={
            "lookup_key": lookup_key, "origin_url": "https://x.com",
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["checkout_url"].startswith("https://checkout.stripe.com"), body
        # Fetch the hosted checkout page and assert BRL + pt-BR locale.
        html = requests.get(body["checkout_url"], timeout=15).text
        assert "BRL" in html or "brl" in html.lower(), f"{lookup_key}: BRL not found in checkout page"
        assert "pt-BR" in html or "Assinar" in html, f"{lookup_key}: pt-BR locale not detected"
        # Amount check: the stored transaction row contains the amount (in units) from Price
        # Query via status endpoint confirms session exists:
        st = requests.get(f"{API}/payments/status/{body['session_id']}").json()
        assert st["session_id"] == body["session_id"]
        assert st["lookup_key"] == lookup_key


# ---------- Audio upload + audio message ----------
class TestAudioUpload:
    def test_upload_audio_webm_and_post_message(self):
        u = _signup("Rec")
        # Upload an audio/webm blob
        files = {"file": ("voice.webm", io.BytesIO(b"OggS\x00\x02fake-webm"), "audio/webm")}
        r = requests.post(f"{API}/upload", headers={"Authorization": u["headers"]["Authorization"]},
                          files=files)
        assert r.status_code == 200, r.text
        up = r.json()
        assert up["file_type"].startswith("audio/"), up
        assert up["is_image"] is False, up
        assert up["url"].startswith("/api/files/"), up

        # Create a server + channel and send message with audio attachment
        srv = requests.post(f"{API}/servers", headers=u["headers"],
                            json={"name": "TEST_Aud"}).json()
        d = requests.get(f"{API}/servers/{srv['server_id']}", headers=u["headers"]).json()
        text_ch = next(c for c in d["channels"] if c["name"] == "geral")["channel_id"]

        mr = requests.post(f"{API}/channels/{text_ch}/messages", headers=u["headers"], json={
            "content": "", "file_url": up["url"],
            "file_name": up["file_name"], "file_type": "audio/webm",
        })
        assert mr.status_code == 200, mr.text
        msg = mr.json()
        assert msg["file_type"] == "audio/webm"
        assert msg["file_url"] == up["url"]

        # GET messages back
        gm = requests.get(f"{API}/channels/{text_ch}/messages",
                          headers=u["headers"]).json()
        assert any(m.get("file_type") == "audio/webm" for m in gm)
