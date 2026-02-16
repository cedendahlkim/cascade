# Task: gen-comb-permutations-3566 | Score: 100% | 2026-02-11T10:27:25.275029

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)