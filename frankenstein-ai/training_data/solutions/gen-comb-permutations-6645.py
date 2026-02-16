# Task: gen-comb-permutations-6645 | Score: 100% | 2026-02-11T10:58:16.961414

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
  print(*perm)