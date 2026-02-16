# Task: gen-comb-permutations-2487 | Score: 100% | 2026-02-11T07:50:52.933805

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