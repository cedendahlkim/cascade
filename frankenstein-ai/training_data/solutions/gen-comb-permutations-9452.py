# Task: gen-comb-permutations-9452 | Score: 100% | 2026-02-11T09:16:15.976638

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = itertools.permutations(nums)

for perm in perms:
  print(*perm)