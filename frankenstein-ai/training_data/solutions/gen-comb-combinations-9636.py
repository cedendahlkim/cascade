# Task: gen-comb-combinations-9636 | Score: 100% | 2026-02-11T09:37:18.893871

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)