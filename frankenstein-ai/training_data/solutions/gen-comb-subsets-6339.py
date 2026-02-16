# Task: gen-comb-subsets-6339 | Score: 100% | 2026-02-11T07:31:29.134588

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  from itertools import combinations
  
  all_subsets = []
  for i in range(n + 1):
    for subset in combinations(nums, i):
      all_subsets.append(list(subset))
      
  for subset in all_subsets:
    print(*subset)

solve()