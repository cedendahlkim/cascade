# Task: gen-comb-combinations-1600 | Score: 100% | 2026-02-11T09:40:00.208819

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