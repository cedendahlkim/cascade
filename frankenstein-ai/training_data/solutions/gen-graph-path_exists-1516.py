# Task: gen-graph-path_exists-1516 | Score: 100% | 2026-02-12T12:01:38.311694

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
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