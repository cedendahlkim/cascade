# Task: gen-comb-permutations-8803 | Score: 100% | 2026-02-11T09:56:20.998946

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
  print(*perm)