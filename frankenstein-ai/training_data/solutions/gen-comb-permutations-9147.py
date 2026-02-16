# Task: gen-comb-permutations-9147 | Score: 100% | 2026-02-10T18:45:14.520157

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)