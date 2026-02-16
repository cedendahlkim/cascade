# Task: gen-graph-adjacency-5781 | Score: 100% | 2026-02-12T13:25:21.936264

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