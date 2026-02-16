# Task: gen-tree-tree_height-7258 | Score: 100% | 2026-02-13T18:33:06.495683

def solve():
    n = int(input())
    adj = [[] for _ in range(n)]
    for _ in range(n - 1):
        u, v = map(int, input().split())
        adj[u].append(v)

    def dfs(node, depth):
        max_depth = depth
        for neighbor in adj[node]:
            max_depth = max(max_depth, dfs(neighbor, depth + 1))
        return max_depth

    print(dfs(0, 0))

solve()