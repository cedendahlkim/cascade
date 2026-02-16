# Task: gen-comb-permutations-1405 | Score: 100% | 2026-02-11T09:11:28.915588

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)