# Task: gen-comb-permutations-3219 | Score: 100% | 2026-02-11T09:21:12.177671

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
  print(*perm)