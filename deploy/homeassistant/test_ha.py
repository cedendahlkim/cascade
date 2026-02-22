#!/usr/bin/env python3
"""Test Home Assistant integration via Bridge API."""
import urllib.request
import json

BASE = "http://localhost:3031"

def get(path):
    req = urllib.request.Request(BASE + path)
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())

def post(path, data):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())

print("=== HA Status ===")
status = get("/api/homeassistant/status")
print(json.dumps(status, indent=2))

print("\n=== HA Devices ===")
devices = get("/api/homeassistant/devices")
print(f"Total: {devices.get('total', 0)}")
for domain, devs in devices.get("devices", {}).items():
    print(f"  {domain}: {len(devs)} enheter")

print("\n=== HA Automations ===")
autos = get("/api/homeassistant/automations")
for a in autos.get("automations", []):
    print(f"  {a['name']}: {a['state']}")

print("\n=== Voice Test ===")
try:
    result = post("/api/homeassistant/voice", {"text": "vad är statusen?", "language": "sv"})
    print(json.dumps(result, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Voice error: {e}")

print("\n=== Done ===")
