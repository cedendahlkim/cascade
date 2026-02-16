# Task: gen-comb-combinations-4210 | Score: 100% | 2026-02-10T18:16:52.348162

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
  print(*combo)