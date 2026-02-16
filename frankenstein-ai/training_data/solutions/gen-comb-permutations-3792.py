# Task: gen-comb-permutations-3792 | Score: 100% | 2026-02-11T10:54:55.492353

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