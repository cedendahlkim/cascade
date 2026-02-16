# Task: gen-comb-permutations-1024 | Score: 100% | 2026-02-10T17:48:15.992679

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  permutations = list(itertools.permutations(nums))
  
  for perm in permutations:
    print(*perm)

solve()