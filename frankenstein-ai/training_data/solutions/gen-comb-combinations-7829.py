# Task: gen-comb-combinations-7829 | Score: 100% | 2026-02-11T10:37:36.667685

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)