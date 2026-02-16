# Task: gen-comb-permutations-4428 | Score: 100% | 2026-02-11T07:25:58.445340

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)