# Task: gen-comb-permutations-8600 | Score: 100% | 2026-02-11T10:33:42.966162

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)