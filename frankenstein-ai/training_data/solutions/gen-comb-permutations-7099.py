# Task: gen-comb-permutations-7099 | Score: 100% | 2026-02-11T08:40:54.841625

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
  print(*permutation)