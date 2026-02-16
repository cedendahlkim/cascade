# Task: gen-comb-permutations-8236 | Score: 100% | 2026-02-10T18:09:45.364437

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

perms = list(itertools.permutations(nums))

for perm in perms:
  print(*perm)