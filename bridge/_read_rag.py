import json

d = json.load(open("data/rag-store.json", encoding="utf-8"))
print("=== RAG SOURCES ===")
for s in d["sources"]:
    print(f"  {s['id']}: {s['name']} ({s['totalLength']} chars)")

print(f"\nTotal: {len(d['sources'])} sources, {len(d['chunks'])} chunks")

# Find AGI-related sources
print("\n=== AGI-RELATERADE KÄLLOR ===")
agi_chunks = []
for c in d["chunks"]:
    text = c.get("text", "").lower()
    if any(kw in text for kw in ["agi", "artificial general intelligence", "superintelligence", "alignment", "general intelligence"]):
        src = next((s for s in d["sources"] if s["id"] == c["sourceId"]), None)
        src_name = src["name"] if src else "?"
        if src_name not in [x[0] for x in agi_chunks]:
            agi_chunks.append((src_name, c["sourceId"]))

for name, sid in agi_chunks:
    print(f"\n  📄 {name}")
    # Print all chunks from this source
    src_chunks = [c for c in d["chunks"] if c["sourceId"] == sid]
    for c in src_chunks:
        print(f"    --- chunk ---")
        print(f"    {c['text'][:500]}")
