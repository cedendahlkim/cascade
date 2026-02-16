# Task: gen-comb-subsets-9047 | Score: 100% | 2026-02-11T08:46:05.884684

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  from itertools import combinations

  for i in range(n + 1):
    for subset in combinations(nums, i):
      print(*subset)

solve()