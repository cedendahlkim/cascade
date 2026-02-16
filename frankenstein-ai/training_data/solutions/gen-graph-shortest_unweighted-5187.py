# Task: gen-graph-shortest_unweighted-5187 | Score: 100% | 2026-02-12T12:04:40.083024

from collections import deque

def bfs():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)
    start, end = map(int, input().split())

    dist = [-1] * n
    dist[start] = 0
    queue = deque([start])

    while queue:
        u = queue.popleft()
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                queue.append(v)

    print(dist[end])

bfs()