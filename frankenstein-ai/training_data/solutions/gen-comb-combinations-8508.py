# Task: gen-comb-combinations-8508 | Score: 100% | 2026-02-11T09:47:27.802787

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

combinations = itertools.combinations(numbers, k)

for combination in combinations:
    print(*combination)