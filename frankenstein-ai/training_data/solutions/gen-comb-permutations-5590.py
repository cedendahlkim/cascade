# Task: gen-comb-permutations-5590 | Score: 100% | 2026-02-10T18:11:09.079439

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