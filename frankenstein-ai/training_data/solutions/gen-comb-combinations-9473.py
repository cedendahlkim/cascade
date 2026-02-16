# Task: gen-comb-combinations-9473 | Score: 100% | 2026-02-11T09:44:29.579226

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

combinations = list(itertools.combinations(numbers, k))

for combination in combinations:
  print(*combination)