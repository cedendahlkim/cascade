# Task: gen-comb-permutations-7585 | Score: 100% | 2026-02-11T07:25:45.113035

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)