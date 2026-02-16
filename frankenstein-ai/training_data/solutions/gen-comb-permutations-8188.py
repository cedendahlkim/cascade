# Task: gen-comb-permutations-8188 | Score: 100% | 2026-02-11T10:14:12.283877

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)