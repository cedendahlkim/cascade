# Task: gen-graph2-bipartite-5010 | Score: 100% | 2026-02-13T19:24:07.974116

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)

    color = [-1] * n
    
    def is_bipartite(start_node):
        q = [(start_node, 0)]
        color[start_node] = 0
        
        while q:
            u, c = q.pop(0)
            
            for v in adj[u]:
                if color[v] == -1:
                    color[v] = 1 - c
                    q.append((v, 1 - c))
                elif color[v] == c:
                    return False
        return True

    for i in range(n):
        if color[i] == -1:
            if not is_bipartite(i):
                print("no")
                return
    
    print("yes")

solve()