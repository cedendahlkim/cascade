# Task: gen-comb-combinations-7421 | Score: 100% | 2026-02-10T18:05:16.667292

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())
  
  combinations = list(itertools.combinations(nums, k))
  
  for comb in combinations:
    print(*comb)

solve()