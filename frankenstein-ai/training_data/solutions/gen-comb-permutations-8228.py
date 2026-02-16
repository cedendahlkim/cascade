# Task: gen-comb-permutations-8228 | Score: 100% | 2026-02-11T09:10:49.322588

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  permutations = list(itertools.permutations(nums))
  permutations.sort()

  for perm in permutations:
    print(*perm)

solve()