# Task: gen-comb-permutations-5034 | Score: 100% | 2026-02-11T10:42:45.172504

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  permutations = list(itertools.permutations(nums))
  
  for perm in sorted(permutations):
    print(*perm)

solve()