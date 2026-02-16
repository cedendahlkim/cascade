# Task: gen-comb-combinations-2467 | Score: 100% | 2026-02-11T08:49:43.133814

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

combinations = itertools.combinations(numbers, k)

for combination in combinations:
  print(*combination)