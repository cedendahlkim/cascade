# Task: gen-graph-count_components-5117 | Score: 100% | 2026-02-12T13:49:15.545216

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v = map(int, input().split())
        edges.append((u, v))

    adj = [[] for _ in range(n + 1)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    visited = [False] * (n + 1)
    count = 0

    def dfs(node):
        visited[node] = True
        for neighbor in adj[node]:
            if not visited[neighbor]:
                dfs(neighbor)

    for i in range(1, n + 1):
        if not visited[i]:
            dfs(i)
            count += 1

    print(count)

solve()