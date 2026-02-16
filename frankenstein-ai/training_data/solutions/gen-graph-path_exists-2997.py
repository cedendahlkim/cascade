# Task: gen-graph-path_exists-2997 | Score: 100% | 2026-02-12T14:25:03.908448

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v = map(int, input().split())
        edges.append((u, v))
    start, end = map(int, input().split())

    graph = {i: [] for i in range(n)}
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)

    def bfs(start_node, end_node, graph):
        visited = [False] * len(graph)
        queue = [start_node]
        visited[start_node] = True

        while queue:
            node = queue.pop(0)
            if node == end_node:
                return True

            for neighbor in graph[node]:
                if not visited[neighbor]:
                    visited[neighbor] = True
                    queue.append(neighbor)

        return False

    if bfs(start, end, graph):
        print("yes")
    else:
        print("no")

solve()