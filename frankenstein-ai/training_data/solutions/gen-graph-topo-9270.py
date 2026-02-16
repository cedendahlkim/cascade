# Task: gen-graph-topo-9270 | Score: 100% | 2026-02-12T18:39:51.622918

def topological_sort():
    n, m = map(int, input().split())
    graph = [[] for _ in range(n)]
    in_degree = [0] * n
    
    for _ in range(m):
        u, v = map(int, input().split())
        graph[u].append(v)
        in_degree[v] += 1
    
    queue = [i for i in range(n) if in_degree[i] == 0]
    result = []
    
    while queue:
        u = queue.pop(0)
        result.append(u)
        
        for v in graph[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)
    
    if len(result) != n:
        print("CYCLE")
    else:
        print(*result)

topological_sort()