# Task: gen-comb-permutations-3705 | Score: 100% | 2026-02-11T11:21:52.623391

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)