# Task: gen-comb-permutations-8605 | Score: 100% | 2026-02-11T11:57:30.239129

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = itertools.permutations(nums)

for perm in perms:
  print(*perm)