# Task: gen-graph-path_exists-9863 | Score: 100% | 2026-02-12T12:08:51.356458

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)
    start, end = map(int, input().split())

    visited = [False] * n
    queue = [start]
    visited[start] = True

    while queue:
        u = queue.pop(0)
        for v in adj[u]:
            if not visited[v]:
                visited[v] = True
                queue.append(v)

    if visited[end]:
        print("yes")
    else:
        print("no")

solve()