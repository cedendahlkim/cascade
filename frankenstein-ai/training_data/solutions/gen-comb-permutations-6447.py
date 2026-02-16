# Task: gen-comb-permutations-6447 | Score: 100% | 2026-02-11T08:59:28.624018

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
  print(*perm)