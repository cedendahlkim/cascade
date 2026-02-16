# Task: gen-comb-permutations-6207 | Score: 100% | 2026-02-11T07:48:59.682595

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)