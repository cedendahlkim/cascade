# Task: gen-comb-combinations-2309 | Score: 100% | 2026-02-11T09:02:01.362015

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

combinations = itertools.combinations(numbers, k)

for combination in combinations:
    print(*combination)