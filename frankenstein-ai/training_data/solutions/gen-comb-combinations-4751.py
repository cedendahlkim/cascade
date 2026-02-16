# Task: gen-comb-combinations-4751 | Score: 100% | 2026-02-11T09:31:05.717416

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)