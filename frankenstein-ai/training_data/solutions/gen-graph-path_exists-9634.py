# Task: gen-graph-path_exists-9634 | Score: 100% | 2026-02-12T13:59:37.073187

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
        graph[v].append(u)

    visited = [False] * n
    queue = [start]
    visited[start] = True

    while queue:
        node = queue.pop(0)
        if node == end:
            print("yes")
            return

        for neighbor in graph[node]:
            if not visited[neighbor]:
                visited[neighbor] = True
                queue.append(neighbor)

    print("no")

solve()