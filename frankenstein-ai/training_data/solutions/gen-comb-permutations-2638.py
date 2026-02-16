# Task: gen-comb-permutations-2638 | Score: 100% | 2026-02-11T10:12:35.084746

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)