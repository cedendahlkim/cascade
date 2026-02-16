# Task: gen-comb-permutations-2720 | Score: 100% | 2026-02-11T08:52:33.444534

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
  print(*permutation)