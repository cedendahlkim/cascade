# Task: gen-graph-shortest_unweighted-2135 | Score: 100% | 2026-02-13T18:00:52.952134

from collections import deque
line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
for _ in range(m):
    u, v = map(int, input().split())
    adj[u].append(v)
    adj[v].append(u)
s, t = map(int, input().split())
if s == t:
    print(0)
else:
    dist = [-1] * n
    dist[s] = 0
    q = deque([s])
    while q:
        curr = q.popleft()
        for nb in adj[curr]:
            if dist[nb] == -1:
                dist[nb] = dist[curr] + 1
                q.append(nb)
    print(dist[t])