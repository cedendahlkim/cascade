# Task: gen-comb-combinations-9773 | Score: 100% | 2026-02-11T11:46:37.149140

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)