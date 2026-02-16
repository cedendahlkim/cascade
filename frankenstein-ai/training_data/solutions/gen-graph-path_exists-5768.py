# Task: gen-graph-path_exists-5768 | Score: 100% | 2026-02-12T19:37:49.696403

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
        if u == end:
            print("yes")
            return
        for v in adj[u]:
            if not visited[v]:
                visited[v] = True
                queue.append(v)

    print("no")

solve()