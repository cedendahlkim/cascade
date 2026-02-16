# Task: gen-graph-path_exists-4910 | Score: 100% | 2026-02-10T15:45:11.927219

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)
    start, end = map(int, input().split())

    visited = [False] * n
    
    def dfs(node):
        visited[node] = True
        if node == end:
            return True
        for neighbor in adj[node]:
            if not visited[neighbor]:
                if dfs(neighbor):
                    return True
        return False

    if dfs(start):
        print("yes")
    else:
        print("no")

solve()