# Task: gen-comb-combinations-9133 | Score: 100% | 2026-02-11T09:57:52.949605

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  for combination in itertools.combinations(nums, k):
    print(*combination)

solve()