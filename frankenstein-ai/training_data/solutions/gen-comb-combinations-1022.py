# Task: gen-comb-combinations-1022 | Score: 100% | 2026-02-10T18:49:08.767734

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

combinations = itertools.combinations(numbers, k)

for combination in combinations:
    print(*combination)