# Task: gen-comb-permutations-9739 | Score: 100% | 2026-02-11T09:02:44.603715

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