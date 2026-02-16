# Task: gen-comb-combinations-6461 | Score: 100% | 2026-02-11T09:58:50.987883

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in itertools.combinations(nums, k):
  print(*combo)