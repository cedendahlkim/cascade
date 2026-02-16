# Task: gen-comb-permutations-8260 | Score: 100% | 2026-02-11T12:08:25.589159

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
  print(*perm)