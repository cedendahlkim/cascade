# Task: gen-comb-permutations-7062 | Score: 100% | 2026-02-11T10:03:57.058393

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
  print(*perm)