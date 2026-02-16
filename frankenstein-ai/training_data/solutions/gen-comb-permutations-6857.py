# Task: gen-comb-permutations-6857 | Score: 100% | 2026-02-11T07:47:19.091948

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)