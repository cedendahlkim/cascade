# Task: gen-graph-adjacency-2918 | Score: 100% | 2026-02-12T16:10:46.906589

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)
    
    for i in range(n):
        adj[i].sort()
        print(*adj[i])

solve()