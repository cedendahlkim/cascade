# Task: gen-comb-combinations-4205 | Score: 100% | 2026-02-11T08:53:10.361014

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)