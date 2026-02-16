# Task: gen-comb-combinations-6780 | Score: 100% | 2026-02-11T08:49:54.725216

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)