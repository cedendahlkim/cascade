# Task: gen-comb-combinations-2976 | Score: 100% | 2026-02-11T10:29:55.978602

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)