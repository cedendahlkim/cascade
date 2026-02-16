# Task: gen-comb-permutations-4675 | Score: 100% | 2026-02-11T09:52:59.508901

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)