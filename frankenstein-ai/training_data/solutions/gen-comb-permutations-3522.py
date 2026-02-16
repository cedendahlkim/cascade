# Task: gen-comb-permutations-3522 | Score: 100% | 2026-02-10T18:15:37.396978

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)