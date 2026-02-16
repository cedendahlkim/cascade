# Task: gen-comb-permutations-5938 | Score: 100% | 2026-02-11T07:43:43.665273

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(input())

  perms = list(itertools.permutations(nums))
  
  for perm in perms:
    print(*perm)

solve()