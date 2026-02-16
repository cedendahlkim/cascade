# Task: gen-comb-combinations-8823 | Score: 100% | 2026-02-11T11:33:29.763586

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)