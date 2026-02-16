# Task: gen-graph-count_components-1074 | Score: 100% | 2026-02-10T19:20:04.466331

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v = map(int, input().split())
        edges.append((u, v))

    parent = list(range(n))

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j

    for u, v in edges:
        union(u, v)

    components = set()
    for i in range(n):
        components.add(find(i))

    print(len(components))

solve()