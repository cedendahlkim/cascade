#!/usr/bin/env python3
"""
Full automated setup of Home Assistant with Gracestack AI conversation agent.
Uses websocket API to add Google Generative AI Conversation (Gemini)
and set it as the default conversation agent in the Assist pipeline.
"""
import json
import sys
import os

try:
    import websocket
except ImportError:
    os.system("pip3 install --break-system-packages websocket-client 2>/dev/null")
    import websocket

WS_BASE = "ws://localhost:8123"
TOKEN = ""
GEMINI_KEY = ""

# Read tokens from bridge/.env
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

if not TOKEN:
    print("ERROR: No HOME_ASSISTANT_TOKEN"); sys.exit(1)
if not GEMINI_KEY:
    print("ERROR: No GEMINI_API_KEY"); sys.exit(1)

# Connect
ws = websocket.create_connection(WS_BASE + "/api/websocket", timeout=15)
msg = json.loads(ws.recv())
ws.send(json.dumps({"type": "auth", "access_token": TOKEN}))
msg = json.loads(ws.recv())
assert msg["type"] == "auth_ok", f"Auth failed: {msg}"
print("OK: Authenticated")

msg_id = 1
def call(msg_type, **kwargs):
    global msg_id
    payload = {"id": msg_id, "type": msg_type}
    payload.update(kwargs)
    ws.send(json.dumps(payload))
    resp = json.loads(ws.recv())
    msg_id += 1
    if not resp.get("success", True):
        print(f"  WS error: {resp.get('error', {})}")
    return resp

# 1. Check existing entries
print("\n--- Config entries ---")
r = call("config_entries/get")
entries = r.get("result", [])
gemini_exists = any(e.get("domain") == "google_generative_ai_conversation" for e in entries)
cast_exists = any(e.get("domain") == "cast" for e in entries)
for e in entries:
    print(f"  {e.get('domain')}: {e.get('title', '?')} [{e.get('state', '?')}]")

# 2. Add Google Generative AI Conversation
if not gemini_exists:
    print("\n--- Adding Gemini Conversation ---")
    r = call("config_entries/flow/create", handler="google_generative_ai_conversation")
    flow = r.get("result", {})
    print(f"  Full flow response: {json.dumps(flow)}")
    flow_id = flow.get("flow_id", "")
    step = flow.get("step_id", "")
    
    if not flow_id:
        print("  ERROR: No flow_id returned. Checking if handler exists...")
        # Try listing available handlers
        r2 = call("config_entries/flow/handlers", type="config")
        handlers = r2.get("result", [])
        gemini_handlers = [h for h in handlers if "gemini" in str(h).lower() or "google_gen" in str(h).lower()]
        print(f"  Matching handlers: {gemini_handlers}")
        if not gemini_handlers:
            print(f"  Available handlers (first 20): {handlers[:20]}")
    elif step == "user":
        print(f"  Submitting API key to flow {flow_id}...")
        r = call("config_entries/flow/handle", flow_id=flow_id, user_input={"api_key": GEMINI_KEY})
        result = r.get("result", {})
        print(f"  Result: type={result.get('type', '?')}")
        if result.get("type") == "create_entry":
            entry = result.get("result", {})
            print(f"  CREATED: {entry.get('title', '?')} (id={entry.get('entry_id', '?')})")
        elif result.get("type") == "form":
            print(f"  Next step: {result.get('step_id', '?')}")
            print(f"  Schema: {json.dumps(result.get('data_schema', []))}")
        else:
            print(f"  Full result: {json.dumps(result)}")
    else:
        print(f"  Unexpected step: {step}")
        print(f"  Full: {json.dumps(flow)}")
else:
    print("\n--- Gemini Conversation already exists ---")

# 3. Add Google Cast
if not cast_exists:
    print("\n--- Adding Google Cast ---")
    r = call("config_entries/flow/create", handler="cast")
    flow = r.get("result", {})
    flow_id = flow.get("flow_id", "")
    step = flow.get("step_id", "")
    print(f"  Flow: step={step}")
    if flow_id:
        r = call("config_entries/flow/handle", flow_id=flow_id, user_input={})
        print(f"  Result: {r.get('result', {}).get('type', '?')}")
else:
    print("\n--- Google Cast already exists ---")

# 4. List conversation agents
print("\n--- Conversation agents ---")
r = call("conversation/agent/list")
agents = r.get("result", {})
print(f"  Raw: {json.dumps(agents)}")

# 5. List and update assist pipelines
print("\n--- Assist pipelines ---")
r = call("assist_pipeline/pipeline/list")
pipelines_data = r.get("result", {})
pipelines = pipelines_data.get("pipelines", [])
preferred = pipelines_data.get("preferred_pipeline", "")
print(f"  Preferred: {preferred}")
for p in pipelines:
    print(f"  {p.get('name', '?')} (id={p.get('id', '?')}, agent={p.get('conversation_engine', '?')}, lang={p.get('conversation_language', '?')})")

# 6. If Gemini agent exists, set it as conversation engine in the preferred pipeline
r = call("config_entries/get")
entries = r.get("result", [])
gemini_entry = next((e for e in entries if e.get("domain") == "google_generative_ai_conversation"), None)

if gemini_entry and pipelines:
    agent_id = gemini_entry.get("entry_id", "")
    pipeline = next((p for p in pipelines if p.get("id") == preferred), pipelines[0])
    pid = pipeline.get("id", "")
    print(f"\n--- Updating pipeline {pid} to use Gemini agent {agent_id} ---")
    r = call("assist_pipeline/pipeline/update",
        pipeline_id=pid,
        conversation_engine=agent_id,
        conversation_language="sv",
        language="sv",
        name=pipeline.get("name", "Home"),
        stt_engine=pipeline.get("stt_engine"),
        stt_language=pipeline.get("stt_language"),
        tts_engine=pipeline.get("tts_engine"),
        tts_language=pipeline.get("tts_language"),
        tts_voice=pipeline.get("tts_voice"),
        wake_word_entity=pipeline.get("wake_word_entity"),
        wake_word_id=pipeline.get("wake_word_id"),
    )
    print(f"  Update result: {json.dumps(r.get('result', r.get('error', {})))}")

ws.close()
print("\n=== DONE ===")
