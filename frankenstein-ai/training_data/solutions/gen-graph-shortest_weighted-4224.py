# Task: gen-graph-shortest_weighted-4224 | Score: 100% | 2026-02-13T14:09:22.647218

import heapq
line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
for _ in range(m):
    parts = input().split()
    u, v, w = int(parts[0]), int(parts[1]), int(parts[2])
    adj[u].append((v, w))
    adj[v].append((u, w))
s, t = map(int, input().split())
dist = [float('inf')] * n
dist[s] = 0
pq = [(0, s)]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist[u]:
        continue
    for v, w in adj[u]:
        if dist[u] + w < dist[v]:
            dist[v] = dist[u] + w
            heapq.heappush(pq, (dist[v], v))
print(dist[t] if dist[t] != float('inf') else -1)