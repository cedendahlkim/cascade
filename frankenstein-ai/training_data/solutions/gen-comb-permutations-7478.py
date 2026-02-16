# Task: gen-comb-permutations-7478 | Score: 100% | 2026-02-10T19:05:56.356782

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = itertools.permutations(numbers)

for permutation in permutations:
  print(*permutation)