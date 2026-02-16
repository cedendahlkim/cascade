# Task: gen-comb-permutations-3308 | Score: 100% | 2026-02-11T09:28:07.658449

import itertools

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
  print(*perm)