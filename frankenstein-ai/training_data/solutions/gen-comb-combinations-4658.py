# Task: gen-comb-combinations-4658 | Score: 100% | 2026-02-11T11:10:49.420331

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)