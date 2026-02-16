# Task: gen-comb-combinations-6718 | Score: 100% | 2026-02-11T08:41:21.124011

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)