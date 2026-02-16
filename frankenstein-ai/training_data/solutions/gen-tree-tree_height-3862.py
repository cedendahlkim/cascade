# Task: gen-tree-tree_height-3862 | Score: 100% | 2026-02-13T18:38:08.697163

def solve():
    n = int(input())
    if n == 0:
        print(0)
        return

    adj = [[] for _ in range(n)]
    for _ in range(n - 1):
        parent, child = map(int, input().split())
        adj[parent].append(child)

    def dfs(node, depth):
        max_depth = depth
        for neighbor in adj[node]:
            max_depth = max(max_depth, dfs(neighbor, depth + 1))
        return max_depth

    print(dfs(0, 0))

solve()