# Task: gen-comb-permutations-1909 | Score: 100% | 2026-02-11T09:04:23.889424

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