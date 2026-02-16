# Task: gen-comb-permutations-2855 | Score: 100% | 2026-02-11T10:55:18.544291

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
  print(*perm)