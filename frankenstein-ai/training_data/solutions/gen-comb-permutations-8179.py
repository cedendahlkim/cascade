# Task: gen-comb-permutations-8179 | Score: 100% | 2026-02-11T09:52:16.587219

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
  print(*perm)