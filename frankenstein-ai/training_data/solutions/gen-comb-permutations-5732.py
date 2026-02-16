# Task: gen-comb-permutations-5732 | Score: 100% | 2026-02-11T08:41:02.713809

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = sorted(list(itertools.permutations(numbers)))

for permutation in permutations:
  print(*permutation)