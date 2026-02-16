# Task: gen-comb-permutations-5423 | Score: 100% | 2026-02-11T10:47:49.894473

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