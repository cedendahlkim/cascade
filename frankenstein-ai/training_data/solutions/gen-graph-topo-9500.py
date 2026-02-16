# Task: gen-graph-topo-9500 | Score: 100% | 2026-02-12T17:40:59.044923

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
    count = 0

    while queue:
        u = queue.pop(0)
        result.append(str(u))
        count += 1

        for v in graph[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    if count != n:
        print("CYCLE")
    else:
        print(" ".join(result))

solve()