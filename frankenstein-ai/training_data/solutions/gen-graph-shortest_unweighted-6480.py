# Task: gen-graph-shortest_unweighted-6480 | Score: 100% | 2026-02-12T13:36:15.595402

from collections import deque

def solve():
    n, m = map(int, input().split())
    adj = [[] for _ in range(n)]
    for _ in range(m):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)
    
    start, end = map(int, input().split())
    
    q = deque([(start, 0)])
    visited = {start}
    
    while q:
        node, dist = q.popleft()
        
        if node == end:
            print(dist)
            return
        
        for neighbor in adj[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                q.append((neighbor, dist + 1))
    
    print(-1)

solve()