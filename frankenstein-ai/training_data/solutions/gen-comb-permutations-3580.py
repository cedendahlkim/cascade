# Task: gen-comb-permutations-3580 | Score: 100% | 2026-02-11T09:26:20.701648

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
  print(*perm)