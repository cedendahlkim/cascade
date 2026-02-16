# Task: gen-graph-path_exists-7921 | Score: 100% | 2026-02-13T13:02:28.928692

line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
for _ in range(m):
    u, v = map(int, input().split())
    adj[u].append(v)
    adj[v].append(u)
s, t = map(int, input().split())
visited = set([s])
queue = [s]
while queue:
    curr = queue.pop(0)
    for nb in adj[curr]:
        if nb not in visited:
            visited.add(nb)
            queue.append(nb)
print('yes' if t in visited else 'no')