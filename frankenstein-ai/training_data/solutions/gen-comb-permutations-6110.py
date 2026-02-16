# Task: gen-comb-permutations-6110 | Score: 100% | 2026-02-11T09:37:15.969590

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)