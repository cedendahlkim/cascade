# Task: gen-comb-permutations-5715 | Score: 100% | 2026-02-11T08:57:16.758577

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