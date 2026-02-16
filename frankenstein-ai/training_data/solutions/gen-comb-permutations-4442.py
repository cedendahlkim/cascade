# Task: gen-comb-permutations-4442 | Score: 100% | 2026-02-11T09:57:14.202002

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)