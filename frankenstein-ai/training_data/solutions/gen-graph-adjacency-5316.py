# Task: gen-graph-adjacency-5316 | Score: 100% | 2026-02-13T13:42:43.790789

line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
for _ in range(m):
    u, v = map(int, input().split())
    adj[u].append(v)
    adj[v].append(u)
for i in range(n):
    print(' '.join(str(x) for x in sorted(adj[i])))