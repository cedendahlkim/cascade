# Task: gen-comb-permutations-5850 | Score: 100% | 2026-02-11T09:55:43.501971

from itertools import permutations

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(input())

  perms = list(permutations(nums))
  
  for perm in perms:
    print(*perm)

solve()