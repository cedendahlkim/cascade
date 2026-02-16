# Task: gen-comb-combinations-5065 | Score: 100% | 2026-02-11T09:17:40.534544

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(input())
k = int(input())

for combo in combinations(elements, k):
    print(' '.join(combo))