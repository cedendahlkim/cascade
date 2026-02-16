# Task: gen-comb-combinations-5469 | Score: 100% | 2026-02-11T09:49:45.384913

from itertools import combinations

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  k = int(input())

  combs = combinations(nums, k)
  for comb in combs:
    print(*comb)

solve()