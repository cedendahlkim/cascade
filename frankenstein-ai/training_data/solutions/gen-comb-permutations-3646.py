# Task: gen-comb-permutations-3646 | Score: 100% | 2026-02-11T09:19:02.812717

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