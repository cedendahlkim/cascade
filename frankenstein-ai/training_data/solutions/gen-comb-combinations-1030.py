# Task: gen-comb-combinations-1030 | Score: 100% | 2026-02-11T10:51:17.287607

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in itertools.combinations(nums, k):
  print(*combo)