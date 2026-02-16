# Task: gen-comb-combinations-4162 | Score: 100% | 2026-02-11T11:44:30.149564

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)