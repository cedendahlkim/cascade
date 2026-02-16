# Task: gen-comb-permutations-1133 | Score: 100% | 2026-02-11T10:56:42.389154

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  perms = list(itertools.permutations(nums))
  perms.sort()
  
  for perm in perms:
    print(*perm)

solve()