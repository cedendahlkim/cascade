# Task: gen-graph-topo-6444 | Score: 100% | 2026-02-12T12:57:22.873355

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    in_degree = [0] * n
    
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        in_degree[v] += 1
    
    q = []
    for i in range(n):
        if in_degree[i] == 0:
            q.append(i)
    
    result = []
    count = 0
    
    while q:
        u = q.pop(0)
        result.append(str(u))
        count += 1
        
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                q.append(v)
    
    if count != n:
        print("CYCLE")
    else:
        print(" ".join(result))

solve()