# Task: gen-comb-permutations-5357 | Score: 100% | 2026-02-11T09:56:33.881957

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