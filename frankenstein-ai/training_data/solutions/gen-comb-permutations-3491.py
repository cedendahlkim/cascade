# Task: gen-comb-permutations-3491 | Score: 100% | 2026-02-11T11:07:34.666106

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(input())

  import itertools
  
  perms = list(itertools.permutations(nums))
  
  for perm in perms:
    print(*perm)

solve()