# Task: gen-graph-path_exists-7710 | Score: 100% | 2026-02-10T15:44:31.022630

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v = map(int, input().split())
        edges.append((u, v))
    
    start, end = map(int, input().split())
    
    adj = {i: [] for i in range(n)}
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    
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