# Task: gen-graph-shortest_weighted-5944 | Score: 100% | 2026-02-12T15:34:27.111863

import heapq

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v, w = map(int, input().split())
        edges.append((u, v, w))
    start, end = map(int, input().split())

    graph = {i: [] for i in range(n)}
    for u, v, w in edges:
        graph[u].append((v, w))

    dist = {i: float('inf') for i in range(n)}
    dist[start] = 0
    pq = [(0, start)]

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue

        for v, w in graph[u]:
            if dist[v] > dist[u] + w:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))

    if dist[end] == float('inf'):
        print(-1)
    else:
        print(dist[end])

solve()