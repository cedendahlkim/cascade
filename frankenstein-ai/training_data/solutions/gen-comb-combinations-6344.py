# Task: gen-comb-combinations-6344 | Score: 100% | 2026-02-10T18:48:27.471285

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