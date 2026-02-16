# Task: gen-graph-shortest_weighted-7696 | Score: 100% | 2026-02-13T08:52:27.752158

import heapq

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v, w = map(int, input().split())
        edges.append((u, v, w))
    start, end = map(int, input().split())

    dist = {i: float('inf') for i in range(n)}
    dist[start] = 0
    pq = [(0, start)]

    while pq:
        d, u = heapq.heappop(pq)

        if d > dist[u]:
            continue

        for v1, v2, w in edges:
            if v1 == u:
                if dist[v2] > dist[u] + w:
                    dist[v2] = dist[u] + w
                    heapq.heappush(pq, (dist[v2], v2))

    if dist[end] == float('inf'):
        print("-1")
    else:
        print(dist[end])

solve()