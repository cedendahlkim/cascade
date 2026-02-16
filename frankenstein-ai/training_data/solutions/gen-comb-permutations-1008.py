# Task: gen-comb-permutations-1008 | Score: 100% | 2026-02-11T08:50:45.390622

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in sorted(perms):
  print(*perm)