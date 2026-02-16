# Task: gen-comb-permutations-4294 | Score: 100% | 2026-02-11T10:39:01.129565

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(' '.join(perm))