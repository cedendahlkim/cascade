# Task: gen-comb-permutations-1156 | Score: 100% | 2026-02-11T11:04:24.990521

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)