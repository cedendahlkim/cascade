# Task: gen-comb-permutations-8074 | Score: 100% | 2026-02-11T12:06:09.858945

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)