# Task: gen-comb-combinations-5311 | Score: 100% | 2026-02-11T10:20:03.900989

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)