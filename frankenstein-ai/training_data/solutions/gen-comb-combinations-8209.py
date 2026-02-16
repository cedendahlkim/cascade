# Task: gen-comb-combinations-8209 | Score: 100% | 2026-02-11T11:41:39.259356

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)