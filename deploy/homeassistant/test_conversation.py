#!/usr/bin/env python3
"""Test Gracestack conversation agent via HA conversation/process API."""
import urllib.request
import json
import sys
import os

BASE = "http://localhost:8123"
TOKEN = os.environ.get("HA_TOKEN", "")

if not TOKEN:
    # Try to read from bridge/.env
    try:
        with open("/home/kim/cascade-remote/bridge/.env") as f:
            for line in f:
                if line.startswith("HOME_ASSISTANT_TOKEN="):
                    TOKEN = line.strip().split("=", 1)[1]
                    break
    except Exception:
        pass

if not TOKEN:
    print("ERROR: No HA_TOKEN found")
    sys.exit(1)

def ha_get(path):
    req = urllib.request.Request(BASE + path, headers={"Authorization": f"Bearer {TOKEN}"})
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())

def ha_post(path, data):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())

# List conversation agents
print("=== Conversation entities ===")
states = ha_get("/api/states")
for s in states:
    if "conversation" in s.get("entity_id", ""):
        print(f"  {s['entity_id']}: {s.get('state', '?')} - {s.get('attributes', {}).get('friendly_name', '?')}")

# Test conversation with Gracestack agent
print("\n=== Testing Gracestack conversation ===")
text = sys.argv[1] if len(sys.argv) > 1 else "Hej, vem är du?"
print(f"Input: {text}")

# Try with gracestack agent
try:
    result = ha_post("/api/conversation/process", {
        "text": text,
        "language": "sv",
        "agent_id": "conversation.gracestack_ai",
    })
    speech = result.get("response", {}).get("speech", {}).get("plain", {}).get("speech", "")
    print(f"Gracestack response: {speech}")
except Exception as e:
    print(f"Gracestack agent error: {e}")
    # Fallback: try default agent
    try:
        result = ha_post("/api/conversation/process", {
            "text": text,
            "language": "sv",
        })
        speech = result.get("response", {}).get("speech", {}).get("plain", {}).get("speech", "")
        print(f"Default agent response: {speech}")
    except Exception as e2:
        print(f"Default agent error: {e2}")

print("\n=== Done ===")
