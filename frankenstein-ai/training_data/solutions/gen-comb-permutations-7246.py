# Task: gen-comb-permutations-7246 | Score: 100% | 2026-02-11T07:40:13.789206

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)