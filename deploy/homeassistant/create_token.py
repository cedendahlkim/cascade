#!/usr/bin/env python3
"""Create a long-lived access token for Home Assistant using the refresh token."""
import urllib.request
import urllib.parse
import json
import sys

BASE = "http://localhost:8123"
REFRESH = sys.argv[1] if len(sys.argv) > 1 else ""

if not REFRESH:
    print("Usage: python3 create_token.py <refresh_token>")
    sys.exit(1)

# Step 1: Get fresh access token
form = urllib.parse.urlencode({
    "grant_type": "refresh_token",
    "client_id": BASE + "/",
    "refresh_token": REFRESH,
}).encode()
req = urllib.request.Request(
    BASE + "/auth/token",
    data=form,
    headers={"Content-Type": "application/x-www-form-urlencoded"},
)
resp = urllib.request.urlopen(req, timeout=15)
tokens = json.loads(resp.read())
at = tokens["access_token"]
print("Got fresh access token")

# Step 2: Try to create LLAT
try:
    data = json.dumps({"client_name": "Gracestack Bridge", "lifespan": 365}).encode()
    req = urllib.request.Request(
        BASE + "/auth/long_lived_access_token",
        data=data,
        headers={
            "Authorization": "Bearer " + at,
            "Content-Type": "application/json",
        },
    )
    resp = urllib.request.urlopen(req, timeout=15)
    llat = resp.read().decode().strip().strip('"')
    print("HOME_ASSISTANT_TOKEN=" + llat)
except Exception as e:
    print("LLAT failed: " + str(e))
    print("HOME_ASSISTANT_TOKEN=" + at)
