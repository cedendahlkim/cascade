# Task: gen-comb-combinations-8024 | Score: 100% | 2026-02-10T17:46:59.915640

from itertools import combinations

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  for comb in combinations(nums, k):
    print(*comb)

solve()