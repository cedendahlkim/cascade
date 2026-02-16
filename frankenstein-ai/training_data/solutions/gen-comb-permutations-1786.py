# Task: gen-comb-permutations-1786 | Score: 100% | 2026-02-11T09:31:19.324253

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(input())

  perms = list(itertools.permutations(nums))
  
  for perm in perms:
    print(*perm)

solve()