# Task: gen-comb-combinations-2917 | Score: 100% | 2026-02-11T09:01:59.715242

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)