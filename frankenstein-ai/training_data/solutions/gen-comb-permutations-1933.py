# Task: gen-comb-permutations-1933 | Score: 100% | 2026-02-11T08:53:06.236841

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  perms = list(itertools.permutations(nums))
  
  for perm in sorted(perms):
    print(*perm)

solve()