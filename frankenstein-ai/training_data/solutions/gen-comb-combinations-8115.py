# Task: gen-comb-combinations-8115 | Score: 100% | 2026-02-11T07:36:41.111909

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)