# Task: gen-comb-combinations-2528 | Score: 100% | 2026-02-11T09:05:38.631228

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)