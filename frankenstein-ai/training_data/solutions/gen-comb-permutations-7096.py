# Task: gen-comb-permutations-7096 | Score: 100% | 2026-02-11T07:26:27.582519

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