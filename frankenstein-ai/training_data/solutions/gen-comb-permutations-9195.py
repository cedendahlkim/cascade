# Task: gen-comb-permutations-9195 | Score: 100% | 2026-02-11T09:50:39.815232

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