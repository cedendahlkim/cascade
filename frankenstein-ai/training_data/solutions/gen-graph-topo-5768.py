# Task: gen-graph-topo-5768 | Score: 100% | 2026-02-12T13:23:25.597234

def topological_sort():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    in_degree = [0] * n

    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        in_degree[v] += 1

    queue = [i for i in range(n) if in_degree[i] == 0]
    result = []
    count = 0

    while queue:
        u = queue.pop(0)
        result.append(str(u))
        count += 1

        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    if count != n:
        print("CYCLE")
    else:
        print(" ".join(result))

topological_sort()