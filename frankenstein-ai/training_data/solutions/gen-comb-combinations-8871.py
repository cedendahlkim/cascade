# Task: gen-comb-combinations-8871 | Score: 100% | 2026-02-11T07:27:32.588230

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
  print(*comb)