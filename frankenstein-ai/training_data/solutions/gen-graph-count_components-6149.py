# Task: gen-graph-count_components-6149 | Score: 100% | 2026-02-13T21:28:17.584864

line = input().split()
n, m = int(line[0]), int(line[1])
parent = list(range(n))
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x
for _ in range(m):
    u, v = map(int, input().split())
    pu, pv = find(u), find(v)
    if pu != pv:
        parent[pu] = pv
print(len(set(find(i) for i in range(n))))