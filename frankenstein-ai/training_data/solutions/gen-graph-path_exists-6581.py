# Task: gen-graph-path_exists-6581 | Score: 100% | 2026-02-13T08:55:12.460890

def solve():
    n, m = map(int, input().split())
    graph = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        graph[u].append(v)

    start, end = map(int, input().split())

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