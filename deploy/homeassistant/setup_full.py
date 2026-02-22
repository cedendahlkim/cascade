#!/usr/bin/env python3
"""
Full automated setup of Home Assistant with Gemini conversation agent.
Uses REST API for config flows + websocket for pipeline updates.
"""
import urllib.request
import json
import sys
import os

BASE = "http://localhost:8123"
TOKEN = ""
GEMINI_KEY = ""

try:
    with open("/home/kim/cascade-remote/bridge/.env") as f:
        for line in f:
            line = line.strip()
            if line.startswith("HOME_ASSISTANT_TOKEN="):
                TOKEN = line.split("=", 1)[1]
            elif line.startswith("GEMINI_API_KEY="):
                GEMINI_KEY = line.split("=", 1)[1]
except Exception:
    pass

if not TOKEN: print("ERROR: No HOME_ASSISTANT_TOKEN"); sys.exit(1)
if not GEMINI_KEY: print("ERROR: No GEMINI_API_KEY"); sys.exit(1)

HEADERS = {"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"}

def ha_get(path):
    req = urllib.request.Request(BASE + path, headers=HEADERS)
    return json.loads(urllib.request.urlopen(req, timeout=15).read())

def ha_post(path, data=None):
    body = json.dumps(data).encode() if data else b"{}"
    req = urllib.request.Request(BASE + path, data=body, headers=HEADERS)
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

# 1. Check existing config entries
print("=== Config entries ===")
entries = ha_get("/api/config/config_entries/entry")
for e in entries:
    print(f"  {e.get('domain')}: {e.get('title', '?')} [{e.get('state', '?')}]")

gemini_exists = any(e.get("domain") == "google_generative_ai_conversation" for e in entries)

# 2. Add Gemini Conversation via config flow REST API
if not gemini_exists:
    print("\n=== Adding Google Generative AI Conversation ===")
    # Start flow
    flow = ha_post("/api/config/config_entries/flow", {"handler": "google_generative_ai_conversation"})
    print(f"  Flow: step={flow.get('step_id')}, flow_id={flow.get('flow_id')}")

    flow_id = flow.get("flow_id", "")
    step = flow.get("step_id", "")

    if flow_id and step == "user":
        # Submit API key
        result = ha_post(f"/api/config/config_entries/flow/{flow_id}", {"api_key": GEMINI_KEY})
        rtype = result.get("type", "")
        print(f"  Result type: {rtype}")
        if rtype == "create_entry":
            entry = result.get("result", {})
            print(f"  CREATED: {entry.get('title', '?')} (entry_id={entry.get('entry_id', '?')})")
        else:
            print(f"  Full: {json.dumps(result)}")
    else:
        print(f"  Full flow: {json.dumps(flow)}")
else:
    print("\n=== Gemini Conversation already exists ===")

# 3. Add Google Cast
cast_exists = any(e.get("domain") == "cast" for e in entries)
if not cast_exists:
    print("\n=== Adding Google Cast ===")
    try:
        flow = ha_post("/api/config/config_entries/flow", {"handler": "cast"})
        flow_id = flow.get("flow_id", "")
        step = flow.get("step_id", "")
        print(f"  Flow: step={step}")
        if flow_id:
            result = ha_post(f"/api/config/config_entries/flow/{flow_id}", {})
            print(f"  Result: {result.get('type', '?')}")
    except Exception as e:
        print(f"  Error: {e}")
else:
    print("\n=== Google Cast already exists ===")

# 4. List conversation agents (via websocket)
print("\n=== Conversation agents ===")
try:
    import websocket
except ImportError:
    os.system("pip3 install --break-system-packages websocket-client 2>/dev/null")
    import websocket

ws = websocket.create_connection("ws://localhost:8123/api/websocket", timeout=15)
json.loads(ws.recv())  # auth_required
ws.send(json.dumps({"type": "auth", "access_token": TOKEN}))
msg = json.loads(ws.recv())
assert msg["type"] == "auth_ok"

msg_id = 1
def ws_call(t, **kw):
    global msg_id
    ws.send(json.dumps({"id": msg_id, "type": t, **kw}))
    r = json.loads(ws.recv())
    msg_id += 1
    return r

r = ws_call("conversation/agent/list")
agents = r.get("result", {}).get("agents", [])
for a in agents:
    print(f"  {a.get('name', '?')} (id={a.get('id', '?')})")

# 5. Update assist pipeline to use Gemini agent
print("\n=== Assist pipelines ===")
r = ws_call("assist_pipeline/pipeline/list")
pipelines = r.get("result", {}).get("pipelines", [])
preferred = r.get("result", {}).get("preferred_pipeline", "")
for p in pipelines:
    print(f"  {p.get('name', '?')} (id={p.get('id')}, agent={p.get('conversation_engine')})")

# Find Gemini agent
entries = ha_get("/api/config/config_entries/entry")
gemini_entry = next((e for e in entries if e.get("domain") == "google_generative_ai_conversation"), None)

if gemini_entry and pipelines:
    agent_id = gemini_entry["entry_id"]
    p = next((p for p in pipelines if p.get("id") == preferred), pipelines[0])
    pid = p["id"]
    print(f"\n=== Setting pipeline {pid} agent to Gemini ({agent_id}) ===")
    r = ws_call("assist_pipeline/pipeline/update",
        pipeline_id=pid,
        conversation_engine=agent_id,
        conversation_language="sv",
        language="sv",
        name=p.get("name", "Home"),
        stt_engine=p.get("stt_engine"),
        stt_language=p.get("stt_language"),
        tts_engine=p.get("tts_engine"),
        tts_language=p.get("tts_language"),
        tts_voice=p.get("tts_voice"),
        wake_word_entity=p.get("wake_word_entity"),
        wake_word_id=p.get("wake_word_id"),
    )
    if r.get("success"):
        print("  Pipeline updated!")
    else:
        print(f"  Error: {r.get('error', {})}")

    # 6. Test conversation with Gemini agent
    print("\n=== Testing Gemini conversation ===")
    try:
        result = ha_post("/api/conversation/process", {
            "text": "Hej, vem är du? Svara kort.",
            "language": "sv",
            "agent_id": agent_id,
        })
        speech = result.get("response", {}).get("speech", {}).get("plain", {}).get("speech", "")
        print(f"  Gemini says: {speech}")
    except Exception as e:
        print(f"  Test error: {e}")
else:
    print("\nNo Gemini entry found - cannot update pipeline")

ws.close()
print("\n=== DONE ===")
