# Task: gen-comb-combinations-9019 | Score: 100% | 2026-02-12T12:22:59.079995

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)