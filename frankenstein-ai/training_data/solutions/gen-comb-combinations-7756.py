# Task: gen-comb-combinations-7756 | Score: 100% | 2026-02-11T12:03:09.011236

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)