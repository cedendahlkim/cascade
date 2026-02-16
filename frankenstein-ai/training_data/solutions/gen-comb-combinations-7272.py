# Task: gen-comb-combinations-7272 | Score: 100% | 2026-02-10T19:13:31.023398

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

combinations = itertools.combinations(numbers, k)

for comb in combinations:
  print(*comb)