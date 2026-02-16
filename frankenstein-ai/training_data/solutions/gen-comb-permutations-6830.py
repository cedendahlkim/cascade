# Task: gen-comb-permutations-6830 | Score: 100% | 2026-02-11T09:27:21.560425

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = itertools.permutations(nums)

for perm in perms:
  print(*perm)