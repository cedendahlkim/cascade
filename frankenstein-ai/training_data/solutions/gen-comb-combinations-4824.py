# Task: gen-comb-combinations-4824 | Score: 100% | 2026-02-11T08:52:59.539580

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)