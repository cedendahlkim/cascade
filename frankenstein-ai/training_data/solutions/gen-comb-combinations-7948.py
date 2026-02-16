# Task: gen-comb-combinations-7948 | Score: 100% | 2026-02-10T18:57:23.550458

import itertools

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in itertools.combinations(elements, k):
    print(*combination)