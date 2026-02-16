# Task: gen-graph-path_exists-8975 | Score: 100% | 2026-02-12T14:34:37.938062

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
        u = queue.pop(0)
        if u == end:
            print("yes")
            return

        for v in graph[u]:
            if not visited[v]:
                visited[v] = True
                queue.append(v)

    print("no")

solve()