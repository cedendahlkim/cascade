# Task: gen-comb-combinations-3286 | Score: 100% | 2026-02-11T11:47:02.402721

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combo in combinations(elements, k):
    print(*combo)