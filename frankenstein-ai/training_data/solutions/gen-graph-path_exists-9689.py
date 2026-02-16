# Task: gen-graph-path_exists-9689 | Score: 100% | 2026-02-12T13:57:18.107939

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
        visited = set()
        queue = [start_node]
        visited.add(start_node)

        while queue:
            node = queue.pop(0)
            if node == end_node:
                return True

            for neighbor in graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        return False

    if bfs(start, end, graph):
        print("yes")
    else:
        print("no")

solve()