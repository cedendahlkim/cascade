# Task: gen-graph2-bipartite-6050 | Score: 100% | 2026-02-13T19:14:39.215414

def solve():
    n, m = map(int, input().split())
    edges = []
    for _ in range(m):
        u, v = map(int, input().split())
        edges.append((u, v))

    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)

    colors = [-1] * n

    def is_bipartite(start_node):
        if colors[start_node] == -1:
            q = [(start_node, 0)]
            colors[start_node] = 0

            while q:
                u, color = q.pop(0)

                for v in adj[u]:
                    if colors[v] == -1:
                        colors[v] = 1 - color
                        q.append((v, 1 - color))
                    elif colors[v] == color:
                        return False
        return True

    for i in range(n):
        if colors[i] == -1:
            if not is_bipartite(i):
                print("no")
                return

    print("yes")

solve()