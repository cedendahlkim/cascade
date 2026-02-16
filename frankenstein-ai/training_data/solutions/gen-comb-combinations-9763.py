# Task: gen-comb-combinations-9763 | Score: 100% | 2026-02-11T09:15:55.198927

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)