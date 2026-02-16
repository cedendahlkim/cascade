# Task: gen-comb-permutations-4288 | Score: 100% | 2026-02-10T17:49:49.878885

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