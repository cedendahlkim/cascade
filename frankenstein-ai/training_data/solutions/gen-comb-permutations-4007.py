# Task: gen-comb-permutations-4007 | Score: 100% | 2026-02-11T07:29:25.727611

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)