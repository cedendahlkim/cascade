# Task: gen-graph-topo-2972 | Score: 100% | 2026-02-11T12:15:56.043172

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v = map(int, input().split())
        edges.append((u, v))

    graph = [[] for _ in range(n)]
    in_degree = [0] * n
    for u, v in edges:
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

solve()