# Task: gen-comb-permutations-7592 | Score: 100% | 2026-02-11T11:28:29.185120

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)