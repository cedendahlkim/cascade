# Task: gen-comb-permutations-4461 | Score: 100% | 2026-02-11T07:27:39.020032

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)