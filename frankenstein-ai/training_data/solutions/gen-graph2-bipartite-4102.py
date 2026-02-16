# Task: gen-graph2-bipartite-4102 | Score: 100% | 2026-02-13T21:27:39.599447

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
            colors[start_node] = 0
            queue = [start_node]
            
            while queue:
                u = queue.pop(0)
                
                for v in adj[u]:
                    if colors[v] == -1:
                        colors[v] = 1 - colors[u]
                        queue.append(v)
                    elif colors[v] == colors[u]:
                        return False
        return True

    for i in range(n):
        if colors[i] == -1:
            if not is_bipartite(i):
                print("no")
                return

    print("yes")

solve()