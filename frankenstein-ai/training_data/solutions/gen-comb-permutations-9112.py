# Task: gen-comb-permutations-9112 | Score: 100% | 2026-02-11T08:44:18.514715

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))
permutations.sort()

for perm in permutations:
  print(*perm)