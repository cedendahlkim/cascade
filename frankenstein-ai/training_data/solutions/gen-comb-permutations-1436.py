# Task: gen-comb-permutations-1436 | Score: 100% | 2026-02-10T19:03:12.890857

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(input())

  perms = itertools.permutations(nums)

  for perm in perms:
    print(*perm)

solve()