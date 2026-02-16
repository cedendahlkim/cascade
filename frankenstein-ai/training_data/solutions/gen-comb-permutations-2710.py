# Task: gen-comb-permutations-2710 | Score: 100% | 2026-02-10T19:13:46.156549

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = itertools.permutations(numbers)

for perm in permutations:
  print(*perm)