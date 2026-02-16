# Task: gen-comb-permutations-7901 | Score: 100% | 2026-02-10T19:10:50.159634

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