# Task: gen-comb-permutations-9607 | Score: 100% | 2026-02-11T07:39:24.474994

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