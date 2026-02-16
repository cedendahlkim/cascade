# Task: gen-graph-topo-3679 | Score: 100% | 2026-02-12T16:25:25.585691

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
    count = 0

    while queue:
        u = queue.pop(0)
        result.append(u)
        count += 1

        for v in graph[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    if count != n:
        print("CYCLE")
    else:
        print(*result)

topological_sort()