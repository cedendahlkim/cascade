# Task: gen-comb-combinations-6591 | Score: 100% | 2026-02-11T09:00:57.933681

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  combinations = itertools.combinations(nums, k)
  for combo in combinations:
    print(*combo)

solve()