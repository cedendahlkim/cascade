# Task: gen-graph-shortest_unweighted-7779 | Score: 100% | 2026-02-13T09:00:22.328680

from collections import deque

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v = map(int, input().split())
        edges.append((u, v))
    start, end = map(int, input().split())

    graph = {i: [] for i in range(n)}
    for u, v in edges:
        graph[u].append(v)

    queue = deque([(start, 0)])
    visited = {start}

    while queue:
        node, dist = queue.popleft()
        if node == end:
            print(dist)
            return

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))

    print(-1)

solve()