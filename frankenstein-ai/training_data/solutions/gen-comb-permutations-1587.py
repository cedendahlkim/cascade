# Task: gen-comb-permutations-1587 | Score: 100% | 2026-02-11T10:53:08.411622

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
  print(*perm)