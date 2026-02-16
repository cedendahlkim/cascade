# Task: gen-comb-permutations-7812 | Score: 100% | 2026-02-10T18:47:42.952500

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