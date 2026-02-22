#!/usr/bin/env python3
"""Home Assistant onboarding + token creation script for Gracestack."""
import urllib.request
import json
import sys

BASE = "http://localhost:8123"

def post(path, data, headers=None):
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode(),
        headers=hdrs,
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP {e.code}: {body}")
        return json.loads(body) if body.startswith("{") else {"error": body}

def get(path, headers=None):
    hdrs = {}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(BASE + path, headers=hdrs)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP {e.code}: {body}")
        return {}

# Check onboarding status
print("=== Checking onboarding status ===")
status = get("/api/onboarding")
print(f"Onboarding steps: {json.dumps(status)}")

user_done = any(s.get("step") == "user" and s.get("done") for s in status) if isinstance(status, list) else True

if not user_done:
    # Step 1: Create user
    print("\n=== Step 1: Creating user ===")
    result = post("/api/onboarding/users", {
        "client_id": BASE + "/",
        "name": "Kim",
        "username": "kim",
        "password": "Gracestack2026!",
        "language": "sv",
    })
    print(f"Result: {json.dumps(result)}")
    auth_code = result.get("auth_code", "")
    if not auth_code:
        print("ERROR: No auth_code received")
        sys.exit(1)
else:
    print("User already created, need to authenticate")
    auth_code = ""

# If we got an auth_code, exchange it for tokens
if auth_code:
    print("\n=== Exchanging auth code for tokens ===")
    token_result = post("/auth/token", {
        # This is form-encoded, not JSON
    })
    # Actually HA uses OAuth flow - let's use the auth_code directly
    # The onboarding returns an auth_code we can use
    
    # Exchange auth code for access token
    import urllib.parse
    form_data = urllib.parse.urlencode({
        "grant_type": "authorization_code",
        "code": auth_code,
        "client_id": BASE + "/",
    }).encode()
    req = urllib.request.Request(
        BASE + "/auth/token",
        data=form_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        tokens = json.loads(resp.read())
        print(f"Access token received: {tokens.get('access_token', '')[:20]}...")
        access_token = tokens["access_token"]
        refresh_token = tokens.get("refresh_token", "")
    except Exception as e:
        print(f"Token exchange error: {e}")
        sys.exit(1)

    # Step 2: Core config
    print("\n=== Step 2: Core config ===")
    result = post("/api/onboarding/core_config", {}, headers={
        "Authorization": f"Bearer {access_token}",
    })
    print(f"Core config: {json.dumps(result)}")

    # Step 3: Analytics (opt out)
    print("\n=== Step 3: Analytics ===")
    result = post("/api/onboarding/analytics", {}, headers={
        "Authorization": f"Bearer {access_token}",
    })
    print(f"Analytics: {json.dumps(result)}")

    # Step 4: Integration
    print("\n=== Step 4: Integration ===")
    result = post("/api/onboarding/integration", {
        "client_id": BASE + "/",
        "redirect_uri": BASE + "/",
    }, headers={
        "Authorization": f"Bearer {access_token}",
    })
    print(f"Integration: {json.dumps(result)}")

    # Step 5: Create long-lived access token
    print("\n=== Step 5: Creating long-lived access token ===")
    # Use websocket API to create LLAT
    import http.client
    import ssl

    # Use REST API to create LLAT via /api/auth/long_lived_access_token  
    # Actually we need to use the websocket API for this
    # Let's try the /auth/long_lived_access_token endpoint
    req = urllib.request.Request(
        BASE + "/api/auth/long_lived_access_token",
        data=json.dumps({
            "client_name": "Gracestack Bridge",
            "lifespan": 365,
        }).encode(),
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        llat = resp.read().decode().strip().strip('"')
        print(f"Long-lived token: {llat[:30]}...")
        print(f"\n=== RESULT ===")
        print(f"HOME_ASSISTANT_TOKEN={llat}")
    except Exception as e:
        print(f"LLAT creation error: {e}")
        # Fallback: just use the access token
        print(f"Using access token as fallback")
        print(f"\n=== RESULT ===")
        print(f"HOME_ASSISTANT_TOKEN={access_token}")
        print(f"HOME_ASSISTANT_REFRESH_TOKEN={refresh_token}")

else:
    print("Cannot proceed without auth_code. Manual setup needed.")
    sys.exit(1)
