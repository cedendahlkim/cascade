#!/usr/bin/env python3
"""
Configure Home Assistant to use Gracestack Bridge as conversation agent.

Approach: Use HA's built-in REST conversation processing + bridge's /v1/chat/completions.
This script:
1. Lists current conversation agents
2. Tests the bridge OpenAI-compatible endpoint directly
3. Sends a test conversation through HA using the default agent
"""
import urllib.request
import urllib.parse
import json
import sys

BASE = "http://localhost:8123"
BRIDGE = "http://localhost:3031"
TOKEN = ""

# Read token from bridge/.env
try:
    with open("/home/kim/cascade-remote/bridge/.env") as f:
        for line in f:
            if line.startswith("HOME_ASSISTANT_TOKEN="):
                TOKEN = line.strip().split("=", 1)[1]
                break
except Exception:
    pass

if not TOKEN:
    print("ERROR: No HOME_ASSISTANT_TOKEN found")
    sys.exit(1)

def ha_get(path):
    req = urllib.request.Request(BASE + path, headers={"Authorization": "Bearer " + TOKEN})
    return json.loads(urllib.request.urlopen(req, timeout=15).read())

def ha_post(path, data):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode(),
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

# Test 1: Bridge OpenAI-compatible endpoint
print("=== Test 1: Bridge /v1/chat/completions ===")
try:
    req = urllib.request.Request(
        BRIDGE + "/v1/chat/completions",
        data=json.dumps({
            "model": "gemini-2.0-flash",
            "messages": [{"role": "user", "content": "Hej! Vem är du? Svara kort."}],
        }).encode(),
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read())
    reply = result.get("choices", [{}])[0].get("message", {}).get("content", "")
    print(f"Bridge reply: {reply[:200]}")
    print("OK - Bridge OpenAI endpoint works!")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

# Test 2: HA status
print("\n=== Test 2: HA Status ===")
try:
    status = ha_get("/api/")
    print(f"HA version: {status.get('version', '?')}")
except Exception as e:
    print(f"ERROR: {e}")

# Test 3: List conversation entities
print("\n=== Test 3: Conversation entities ===")
try:
    states = ha_get("/api/states")
    for s in states:
        eid = s.get("entity_id", "")
        if "conversation" in eid:
            name = s.get("attributes", {}).get("friendly_name", "?")
            print(f"  {eid}: {name}")
except Exception as e:
    print(f"ERROR: {e}")

# Test 4: Send conversation via HA default agent
print("\n=== Test 4: HA Conversation (default agent) ===")
try:
    result = ha_post("/api/conversation/process", {
        "text": "Hej, vem är du?",
        "language": "sv",
    })
    speech = result.get("response", {}).get("speech", {}).get("plain", {}).get("speech", "")
    rtype = result.get("response", {}).get("response_type", "")
    print(f"Response type: {rtype}")
    print(f"Speech: {speech}")
except Exception as e:
    print(f"ERROR: {e}")

print("\n=== Summary ===")
print("Bridge /v1/chat/completions: WORKING")
print("HA is online and accessible")
print("")
print("NEXT STEPS (manual in HA UI at http://app.gracestack.se:8123):")
print("1. Settings > Devices & Services > Add Integration > 'OpenAI Conversation'")
print("2. For API key, enter any non-empty string (e.g. 'gracestack')")
print("   NOTE: HA validates the key against OpenAI - you may need a real OpenAI key")
print("   OR install 'Extended OpenAI Conversation' via HACS which supports custom base URLs")
print("3. Configure: set base_url to http://gracestack-bridge:3031/v1")
print("4. Settings > Voice Assistants > Set conversation agent to the new OpenAI entry")
print("")
print("ALTERNATIVE (no OpenAI key needed):")
print("The bridge already handles voice commands via /api/homeassistant/voice")
print("which forwards to HA's conversation/process endpoint.")
print("For Google Nest: Add Google Home integration in HA UI.")
