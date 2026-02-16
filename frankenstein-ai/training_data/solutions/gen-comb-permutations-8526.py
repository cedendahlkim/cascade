# Task: gen-comb-permutations-8526 | Score: 100% | 2026-02-11T08:52:48.508630

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