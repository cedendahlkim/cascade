# Task: gen-comb-combinations-1885 | Score: 100% | 2026-02-10T18:37:42.395231

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)