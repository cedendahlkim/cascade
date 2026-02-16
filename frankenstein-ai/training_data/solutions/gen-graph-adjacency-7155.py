# Task: gen-graph-adjacency-7155 | Score: 100% | 2026-02-12T17:17:31.661248

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)

    for i in range(n):
        adj[i] = sorted(list(set(adj[i])))
        print(*adj[i])

solve()