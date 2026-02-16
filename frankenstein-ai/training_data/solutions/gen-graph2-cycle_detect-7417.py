# Task: gen-graph2-cycle_detect-7417 | Score: 100% | 2026-02-15T07:52:50.553212

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)

    def has_cycle():
        visited = [0] * n  # 0: unvisited, 1: visiting, 2: visited
        
        def dfs(node):
            visited[node] = 1
            for neighbor in adj[node]:
                if visited[neighbor] == 1:
                    return True
                if visited[neighbor] == 0:
                    if dfs(neighbor):
                        return True
            visited[node] = 2
            return False

        for i in range(n):
            if visited[i] == 0:
                if dfs(i):
                    return True
        return False

    if has_cycle():
        print("yes")
    else:
        print("no")

solve()