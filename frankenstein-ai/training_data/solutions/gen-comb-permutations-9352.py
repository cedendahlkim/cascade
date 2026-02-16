# Task: gen-comb-permutations-9352 | Score: 100% | 2026-02-11T09:15:53.890134

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
  print(*permutation)