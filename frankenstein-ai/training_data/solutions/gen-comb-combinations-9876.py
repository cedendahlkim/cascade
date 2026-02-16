# Task: gen-comb-combinations-9876 | Score: 100% | 2026-02-11T11:02:34.000461

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)