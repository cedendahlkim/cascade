# Task: gen-graph-count_components-9263 | Score: 100% | 2026-02-11T07:25:14.024617

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v = map(int, input().split())
        edges.append((u, v))

    def build_graph(n, edges):
        graph = {i: [] for i in range(n)}
        for u, v in edges:
            graph[u].append(v)
            graph[v].append(u)
        return graph

    def dfs(graph, start_node, visited):
        stack = [start_node]
        visited.add(start_node)
        while stack:
            node = stack.pop()
            for neighbor in graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    stack.append(neighbor)

    graph = build_graph(n, edges)
    visited = set()
    count = 0

    for node in range(n):
        if node not in visited:
            dfs(graph, node, visited)
            count += 1

    print(count)

solve()