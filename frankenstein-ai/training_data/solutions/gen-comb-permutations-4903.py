# Task: gen-comb-permutations-4903 | Score: 100% | 2026-02-11T11:14:49.874733

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