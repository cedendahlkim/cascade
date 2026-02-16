# Task: gen-comb-permutations-4072 | Score: 100% | 2026-02-11T08:55:14.828516

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
  print(*perm)