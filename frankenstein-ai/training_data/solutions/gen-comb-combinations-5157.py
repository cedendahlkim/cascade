# Task: gen-comb-combinations-5157 | Score: 100% | 2026-02-10T18:52:27.015678

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

combinations = list(itertools.combinations(numbers, k))

for comb in combinations:
    print(*comb)