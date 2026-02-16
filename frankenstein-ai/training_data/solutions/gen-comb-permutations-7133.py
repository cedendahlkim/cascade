# Task: gen-comb-permutations-7133 | Score: 100% | 2026-02-10T18:04:37.539283

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