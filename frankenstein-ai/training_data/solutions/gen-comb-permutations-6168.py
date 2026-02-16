# Task: gen-comb-permutations-6168 | Score: 100% | 2026-02-11T09:01:19.173686

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