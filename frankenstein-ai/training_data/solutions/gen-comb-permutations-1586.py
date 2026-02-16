# Task: gen-comb-permutations-1586 | Score: 100% | 2026-02-10T19:07:50.427437

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)