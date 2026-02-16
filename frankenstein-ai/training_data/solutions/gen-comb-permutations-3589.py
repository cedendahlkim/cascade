# Task: gen-comb-permutations-3589 | Score: 100% | 2026-02-11T09:44:25.974510

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