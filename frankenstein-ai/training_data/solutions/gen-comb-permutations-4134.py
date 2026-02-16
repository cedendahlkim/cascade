# Task: gen-comb-permutations-4134 | Score: 100% | 2026-02-11T09:50:50.585454

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