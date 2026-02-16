# Task: gen-comb-combinations-8608 | Score: 100% | 2026-02-11T11:31:35.387363

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)