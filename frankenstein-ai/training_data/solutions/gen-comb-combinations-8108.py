# Task: gen-comb-combinations-8108 | Score: 100% | 2026-02-11T09:11:49.986209

import itertools

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

combinations = itertools.combinations(elements, k)

for comb in combinations:
    print(*comb)