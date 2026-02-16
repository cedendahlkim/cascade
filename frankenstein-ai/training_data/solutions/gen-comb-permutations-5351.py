# Task: gen-comb-permutations-5351 | Score: 100% | 2026-02-11T10:42:32.801672

import itertools

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))
  
  permutations = list(itertools.permutations(nums))
  
  for perm in sorted(permutations):
    print(*perm)

solve()