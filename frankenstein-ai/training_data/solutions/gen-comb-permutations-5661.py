# Task: gen-comb-permutations-5661 | Score: 100% | 2026-02-11T10:10:18.680407

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