# Task: gen-comb-combinations-3953 | Score: 100% | 2026-02-10T19:09:10.857782

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)