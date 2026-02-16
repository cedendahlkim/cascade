# Task: gen-comb-combinations-6818 | Score: 100% | 2026-02-10T18:31:45.063768

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combo in combinations(elements, k):
    print(*combo)