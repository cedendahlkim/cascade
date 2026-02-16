# Task: gen-comb-combinations-7863 | Score: 100% | 2026-02-11T12:08:09.053733

import itertools

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in itertools.combinations(nums, k):
  print(*comb)