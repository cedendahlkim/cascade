# Task: gen-comb-permutations-5298 | Score: 100% | 2026-02-11T07:29:27.494546

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  permutations = list(itertools.permutations(nums))

  for perm in permutations:
    print(*perm)

solve()