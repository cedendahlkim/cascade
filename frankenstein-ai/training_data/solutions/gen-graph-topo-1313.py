# Task: gen-graph-topo-1313 | Score: 100% | 2026-02-12T17:58:22.298892

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    in_degree = [0] * n
    
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        in_degree[v] += 1
    
    queue = []
    for i in range(n):
        if in_degree[i] == 0:
            queue.append(i)
    
    result = []
    count = 0
    
    while queue:
        u = queue.pop(0)
        result.append(u)
        count += 1
        
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)
    
    if count != n:
        print("CYCLE")
    else:
        print(*result)

solve()