# Task: gen-comb-permutations-3318 | Score: 100% | 2026-02-11T09:22:52.699363

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in sorted(perms):
  print(*perm)