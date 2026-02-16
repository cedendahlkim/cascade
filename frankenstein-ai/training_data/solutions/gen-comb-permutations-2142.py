# Task: gen-comb-permutations-2142 | Score: 100% | 2026-02-11T09:24:01.270861

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
  print(*perm)