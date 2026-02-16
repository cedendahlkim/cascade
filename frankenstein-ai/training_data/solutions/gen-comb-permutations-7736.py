# Task: gen-comb-permutations-7736 | Score: 100% | 2026-02-11T11:16:31.656149

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)