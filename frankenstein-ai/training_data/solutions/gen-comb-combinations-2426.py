# Task: gen-comb-combinations-2426 | Score: 100% | 2026-02-11T08:41:07.593285

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

combinations = list(itertools.combinations(numbers, k))

for combination in combinations:
  print(*combination)