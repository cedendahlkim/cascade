# Task: gen-graph-shortest_weighted-4222 | Score: 100% | 2026-02-12T18:00:01.561086

import heapq

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v, w = map(int, input().split())
        edges.append((u, v, w))
    start, end = map(int, input().split())

    graph = [[] for _ in range(n)]
    for u, v, w in edges:
        graph[u].append((v, w))

    dist = {i: float('inf') for i in range(n)}
    dist[start] = 0
    pq = [(0, start)]

    while pq:
        d, u = heapq.heappop(pq)

        if d > dist[u]:
            continue

        for v, weight in graph[u]:
            if dist[v] > dist[u] + weight:
                dist[v] = dist[u] + weight
                heapq.heappush(pq, (dist[v], v))

    if dist[end] == float('inf'):
        print("-1")
    else:
        print(dist[end])

solve()