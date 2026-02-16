# Task: gen-comb-combinations-4114 | Score: 100% | 2026-02-11T09:21:57.102141

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(input())
k = int(input())

for combination in combinations(elements, k):
    print(' '.join(combination))