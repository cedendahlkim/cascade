# Task: gen-comb-permutations-3506 | Score: 100% | 2026-02-11T08:55:44.329936

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