"""Backend tests for iteration 4: age-gated signup, Stripe checkout, payment status, plans."""
import os
import uuid
import pytest
import requests
from datetime import date

BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL') or 'https://infra-boost-creative.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


def _rand_email():
    return f"TEST_{uuid.uuid4().hex[:8]}@test.com"


# -------------------- Signup age gate --------------------
class TestSignupAge:
    def test_missing_birth_date_returns_422(self):
        r = requests.post(f"{API}/auth/signup", json={
            "name": "No Age", "email": _rand_email(), "password": "pass1234"
        })
        assert r.status_code == 422, r.text

    def test_under_13_returns_400(self):
        # 10 years old today
        y = date.today().year - 10
        r = requests.post(f"{API}/auth/signup", json={
            "name": "Kid", "email": _rand_email(), "password": "pass1234",
            "birth_date": f"{y}-01-01"
        })
        assert r.status_code == 400, r.text
        assert "13" in r.json().get("detail", "")

    def test_13_plus_signup_succeeds(self):
        email = _rand_email()
        r = requests.post(f"{API}/auth/signup", json={
            "name": "Adult", "email": email, "password": "pass1234",
            "birth_date": "2000-01-01"
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d and "user" in d
        assert d["user"]["email"] == email.lower()


# -------------------- Plans --------------------
class TestPlans:
    def test_plans_returns_lookup_keys(self):
        r = requests.get(f"{API}/plans")
        assert r.status_code == 200, r.text
        data = r.json()
        # Expect plan→lookup_key mapping (dict) containing all 4 keys
        s = str(data)
        for k in ["pro_monthly", "pro_yearly", "community_monthly", "community_yearly"]:
            assert k in s, f"missing lookup_key {k} in /plans response: {data}"


# -------------------- Stripe Checkout --------------------
@pytest.fixture(scope="module")
def auth_user():
    email = _rand_email()
    r = requests.post(f"{API}/auth/signup", json={
        "name": "Payer", "email": email, "password": "pass1234",
        "birth_date": "1995-05-05"
    })
    assert r.status_code == 200, r.text
    d = r.json()
    return {"headers": {"Authorization": f"Bearer {d['token']}"}, "user": d["user"]}


class TestStripeCheckout:
    def test_unauthenticated_returns_401(self):
        r = requests.post(f"{API}/payments/checkout", json={
            "lookup_key": "pro_monthly", "origin_url": "https://x.com"
        })
        assert r.status_code == 401

    def test_invalid_lookup_key_returns_400(self, auth_user):
        r = requests.post(f"{API}/payments/checkout",
                          headers=auth_user["headers"],
                          json={"lookup_key": "does_not_exist_xyz",
                                "origin_url": "https://x.com"})
        assert r.status_code == 400, r.text

    def test_valid_checkout_returns_url(self, auth_user):
        r = requests.post(f"{API}/payments/checkout",
                          headers=auth_user["headers"],
                          json={"lookup_key": "pro_monthly",
                                "origin_url": "https://x.com"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "checkout_url" in d
        assert d["checkout_url"].startswith("https://checkout.stripe.com"), d["checkout_url"]
        assert "session_id" in d and d["session_id"]
        # Save for next test
        pytest.stripe_session_id = d["session_id"]

    def test_payment_status(self, auth_user):
        sid = getattr(pytest, "stripe_session_id", None)
        if not sid:
            pytest.skip("No session id from previous test")
        r = requests.get(f"{API}/payments/status/{sid}",
                         headers=auth_user["headers"])
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["session_id"] == sid
        assert "status" in d
        assert "payment_status" in d
        # Should be pending/unpaid until actually paid
        assert d["payment_status"] in ("pending", "unpaid", "no_payment_required", "paid")
