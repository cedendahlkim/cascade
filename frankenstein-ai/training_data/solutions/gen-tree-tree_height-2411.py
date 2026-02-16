# Task: gen-tree-tree_height-2411 | Score: 100% | 2026-02-13T21:08:15.248515

def solve():
    n = int(input())
    
    if n == 1:
        print(0)
        return
    
    adj = [[] for _ in range(n)]
    
    for _ in range(n - 1):
        parent, child = map(int, input().split())
        adj[parent].append(child)
    
    def bfs(start_node):
        q = [(start_node, 0)]
        max_depth = 0
        
        while q:
            node, depth = q.pop(0)
            max_depth = max(max_depth, depth)
            
            for neighbor in adj[node]:
                q.append((neighbor, depth + 1))
        
        return max_depth
    
    print(bfs(0))

solve()