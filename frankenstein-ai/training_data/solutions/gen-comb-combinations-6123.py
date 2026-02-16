# Task: gen-comb-combinations-6123 | Score: 100% | 2026-02-11T11:02:00.607950

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

combinations = itertools.combinations(numbers, k)

for combination in combinations:
    print(*combination)