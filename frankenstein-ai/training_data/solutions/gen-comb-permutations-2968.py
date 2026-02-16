# Task: gen-comb-permutations-2968 | Score: 100% | 2026-02-11T10:21:19.985408

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)