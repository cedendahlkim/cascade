# Task: gen-comb-permutations-6708 | Score: 100% | 2026-02-11T11:37:18.418023

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)