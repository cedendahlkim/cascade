# Task: gen-comb-permutations-7547 | Score: 100% | 2026-02-10T17:56:34.862197

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