# Task: gen-comb-combinations-7754 | Score: 100% | 2026-02-11T10:11:43.547906

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

combinations = itertools.combinations(numbers, k)

for combination in combinations:
    print(*combination)