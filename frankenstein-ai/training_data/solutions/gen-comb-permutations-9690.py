# Task: gen-comb-permutations-9690 | Score: 100% | 2026-02-11T10:38:42.517066

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(input())

  perms = list(itertools.permutations(nums))
  perms.sort()

  for perm in perms:
    print(*perm)

solve()