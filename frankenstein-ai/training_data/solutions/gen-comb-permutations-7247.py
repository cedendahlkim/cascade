# Task: gen-comb-permutations-7247 | Score: 100% | 2026-02-10T18:48:43.380461

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
  print(*perm)