# Task: gen-comb-permutations-9538 | Score: 100% | 2026-02-10T19:00:19.643900

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