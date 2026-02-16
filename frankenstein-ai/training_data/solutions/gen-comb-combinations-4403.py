# Task: gen-comb-combinations-4403 | Score: 100% | 2026-02-11T10:43:09.724950

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)