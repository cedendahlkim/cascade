# Task: gen-graph-shortest_weighted-5606 | Score: 100% | 2026-02-12T18:04:04.910442

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

    distances = {i: float('inf') for i in range(n)}
    distances[start] = 0
    pq = [(0, start)]

    while pq:
        dist, u = heapq.heappop(pq)

        if dist > distances[u]:
            continue

        for v, weight in graph[u]:
            if distances[v] > distances[u] + weight:
                distances[v] = distances[u] + weight
                heapq.heappush(pq, (distances[v], v))

    if distances[end] == float('inf'):
        print(-1)
    else:
        print(distances[end])

solve()