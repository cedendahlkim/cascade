#!/usr/bin/env python3
"""Create a long-lived access token for Home Assistant using the refresh token via websocket."""
import urllib.request
import urllib.parse
import json
import sys
import websocket  # pip install websocket-client

BASE = "http://localhost:8123"
WS_BASE = "ws://localhost:8123"
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

# Step 2: Create LLAT via websocket API
ws = websocket.create_connection(WS_BASE + "/api/websocket", timeout=15)

# Receive auth_required
msg = json.loads(ws.recv())
assert msg["type"] == "auth_required", f"Unexpected: {msg}"

# Send auth
ws.send(json.dumps({"type": "auth", "access_token": at}))
msg = json.loads(ws.recv())
assert msg["type"] == "auth_ok", f"Auth failed: {msg}"
print("Websocket authenticated")

# Create long-lived access token
ws.send(json.dumps({
    "id": 1,
    "type": "auth/long_lived_access_token",
    "client_name": "Gracestack Bridge",
    "lifespan": 365,
}))
msg = json.loads(ws.recv())
ws.close()

if msg.get("success"):
    llat = msg["result"]
    print("HOME_ASSISTANT_TOKEN=" + llat)
else:
    print("LLAT failed: " + json.dumps(msg))
    print("HOME_ASSISTANT_TOKEN=" + at)
