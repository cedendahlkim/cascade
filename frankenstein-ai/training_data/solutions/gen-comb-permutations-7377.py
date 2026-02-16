# Task: gen-comb-permutations-7377 | Score: 100% | 2026-02-11T10:50:22.205049

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  perms = list(itertools.permutations(nums))
  perms.sort()
  
  for perm in perms:
    print(*perm)

solve()