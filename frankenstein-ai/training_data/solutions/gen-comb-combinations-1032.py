# Task: gen-comb-combinations-1032 | Score: 100% | 2026-02-11T11:46:11.658663

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)