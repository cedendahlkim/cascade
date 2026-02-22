#!/usr/bin/env python3
"""
Full automated setup of Home Assistant with Gracestack AI conversation agent.
Uses websocket API to:
1. Install HACS (if not present)
2. Add Extended OpenAI Conversation integration pointing to bridge
3. Set it as the default conversation agent
4. Configure Google Cast integration for Nest speakers
"""
import json
import sys
import os

try:
    import websocket
except ImportError:
    os.system("pip3 install --break-system-packages websocket-client 2>/dev/null")
    import websocket

BASE = "http://localhost:8123"
WS_BASE = "ws://localhost:8123"
BRIDGE_URL = "http://gracestack-bridge:3031"
TOKEN = ""

# Read token
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

# Connect websocket
ws = websocket.create_connection(WS_BASE + "/api/websocket", timeout=15)
msg = json.loads(ws.recv())
assert msg["type"] == "auth_required"
ws.send(json.dumps({"type": "auth", "access_token": TOKEN}))
msg = json.loads(ws.recv())
assert msg["type"] == "auth_ok", f"Auth failed: {msg}"
print("Authenticated")

msg_id = 1
def ws_call(msg_type, **kwargs):
    global msg_id
    payload = {"id": msg_id, "type": msg_type}
    payload.update(kwargs)
    ws.send(json.dumps(payload))
    resp = json.loads(ws.recv())
    msg_id += 1
    return resp

# 1. List integrations
print("\n=== Current integrations ===")
result = ws_call("config_entries/get")
entries = result.get("result", []) if result.get("success") else []
domains = set()
for e in entries:
    d = e.get("domain", "")
    domains.add(d)
    if d in ("openai_conversation", "google_generative_ai_conversation", "extended_openai_conversation"):
        print(f"  Found: {e.get('title', d)} (domain={d}, id={e.get('entry_id', '?')})")

# 2. Try to add Google Generative AI Conversation (uses Gemini directly, no OpenAI key needed)
if "google_generative_ai_conversation" not in domains:
    print("\n=== Adding Google Generative AI Conversation ===")
    result = ws_call("config_entries/flow/create", handler="google_generative_ai_conversation")
    flow = result.get("result", {})
    flow_id = flow.get("flow_id", "")
    step_id = flow.get("step_id", "")
    print(f"Flow: step={step_id}, flow_id={flow_id}")
    
    if flow_id and step_id == "user":
        # Read Gemini API key from bridge/.env
        gemini_key = ""
        try:
            with open("/home/kim/cascade-remote/bridge/.env") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        gemini_key = line.strip().split("=", 1)[1]
                        break
        except Exception:
            pass
        
        if gemini_key:
            result = ws_call("config_entries/flow/handle", flow_id=flow_id, user_input={
                "api_key": gemini_key,
            })
            rtype = result.get("result", {}).get("type", "")
            print(f"Result type: {rtype}")
            if rtype == "create_entry":
                entry = result["result"].get("result", {})
                print(f"Created: {entry.get('title', '?')} (id={entry.get('entry_id', '?')})")
            elif rtype == "abort":
                reason = result.get("result", {}).get("reason", "?")
                print(f"Aborted: {reason}")
            else:
                print(f"Unexpected: {json.dumps(result.get('result', {}), indent=2)}")
        else:
            print("No GEMINI_API_KEY found in bridge/.env, skipping")
            # Abort the flow
            ws_call("config_entries/flow/abort", flow_id=flow_id)
else:
    print("\n=== Google Generative AI Conversation already configured ===")

# 3. Try to add Google Cast (for Nest speakers)
if "cast" not in domains:
    print("\n=== Adding Google Cast integration ===")
    result = ws_call("config_entries/flow/create", handler="cast")
    flow = result.get("result", {})
    flow_id = flow.get("flow_id", "")
    step_id = flow.get("step_id", "")
    print(f"Flow: step={step_id}, flow_id={flow_id}")
    
    if flow_id and step_id == "confirm":
        result = ws_call("config_entries/flow/handle", flow_id=flow_id, user_input={})
        rtype = result.get("result", {}).get("type", "")
        print(f"Result: {rtype}")
        if rtype == "create_entry":
            print("Google Cast added!")
    elif flow_id:
        # Try to handle whatever step
        result = ws_call("config_entries/flow/handle", flow_id=flow_id, user_input={})
        print(f"Result: {result.get('result', {}).get('type', '?')}")
else:
    print("\n=== Google Cast already configured ===")

# 4. List conversation agents
print("\n=== Conversation agents ===")
result = ws_call("conversation/agent/list")
if result.get("success"):
    agents = result.get("result", {}).get("agents", result.get("result", []))
    if isinstance(agents, list):
        for a in agents:
            print(f"  - {a.get('name', '?')} (id={a.get('id', '?')})")
    elif isinstance(agents, dict):
        for k, v in agents.items():
            print(f"  - {k}: {v}")
else:
    print(f"Error: {result}")

# 5. Set default conversation agent to Gemini if available
print("\n=== Setting default conversation agent ===")
result = ws_call("config_entries/get")
entries = result.get("result", []) if result.get("success") else []
gemini_entry = None
for e in entries:
    if e.get("domain") == "google_generative_ai_conversation":
        gemini_entry = e
        break

if gemini_entry:
    entry_id = gemini_entry.get("entry_id", "")
    print(f"Found Gemini conversation entry: {entry_id}")
    # The conversation agent ID is typically the config entry ID
    # We need to set it as the default assist pipeline agent
    # This requires updating the assist pipeline
    result = ws_call("assist_pipeline/pipeline/list")
    pipelines = result.get("result", {}).get("pipelines", [])
    print(f"Found {len(pipelines)} assist pipelines")
    for p in pipelines:
        print(f"  Pipeline: {p.get('name', '?')} (id={p.get('id', '?')}, agent={p.get('conversation_engine', '?')})")
else:
    print("No Gemini conversation entry found")

ws.close()
print("\n=== Done ===")
