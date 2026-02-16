# Task: gen-comb-combinations-8065 | Score: 100% | 2026-02-11T11:20:33.309156

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)