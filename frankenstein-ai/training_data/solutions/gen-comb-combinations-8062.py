# Task: gen-comb-combinations-8062 | Score: 100% | 2026-02-10T18:37:20.128200

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

combinations = itertools.combinations(numbers, k)

for combination in combinations:
  print(*combination)