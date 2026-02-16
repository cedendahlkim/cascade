# Task: gen-comb-combinations-9827 | Score: 100% | 2026-02-11T09:53:39.801887

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)