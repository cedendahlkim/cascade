# Task: gen-comb-combinations-8452 | Score: 100% | 2026-02-10T19:00:05.526426

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)