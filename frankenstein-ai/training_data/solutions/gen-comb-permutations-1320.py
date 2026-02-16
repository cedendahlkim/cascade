# Task: gen-comb-permutations-1320 | Score: 100% | 2026-02-10T18:43:20.417063

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  perms = list(itertools.permutations(nums))
  
  for perm in perms:
    print(*perm)

solve()