# Task: gen-comb-permutations-1624 | Score: 100% | 2026-02-11T09:16:46.118426

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