# Task: gen-graph-topo-7990 | Score: 100% | 2026-02-12T13:47:10.460214

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    in_degree = [0] * n
    
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        in_degree[v] += 1
    
    queue = [i for i in range(n) if in_degree[i] == 0]
    result = []
    
    while queue:
        u = queue.pop(0)
        result.append(str(u))
        
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)
    
    if len(result) != n:
        print("CYCLE")
    else:
        print(" ".join(result))

solve()