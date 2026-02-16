# Task: gen-comb-combinations-4804 | Score: 100% | 2026-02-10T18:41:56.704370

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  for comb in itertools.combinations(nums, k):
    print(*comb)

solve()