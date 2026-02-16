# Task: gen-graph-topo-2004 | Score: 100% | 2026-02-15T07:52:49.113921

from collections import deque
line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
indeg = [0] * n
for _ in range(m):
    u, v = map(int, input().split())
    adj[u].append(v)
    indeg[v] += 1
q = deque(i for i in range(n) if indeg[i] == 0)
order = []
while q:
    node = q.popleft()
    order.append(node)
    for nb in adj[node]:
        indeg[nb] -= 1
        if indeg[nb] == 0:
            q.append(nb)
if len(order) != n:
    print('CYCLE')
else:
    print(' '.join(str(x) for x in order))