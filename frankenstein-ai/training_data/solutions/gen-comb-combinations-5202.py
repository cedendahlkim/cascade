# Task: gen-comb-combinations-5202 | Score: 100% | 2026-02-11T09:12:14.137621

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)