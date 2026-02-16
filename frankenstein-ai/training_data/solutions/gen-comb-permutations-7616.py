# Task: gen-comb-permutations-7616 | Score: 100% | 2026-02-11T07:35:03.025223

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