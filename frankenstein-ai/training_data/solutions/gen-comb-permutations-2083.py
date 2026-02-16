# Task: gen-comb-permutations-2083 | Score: 100% | 2026-02-11T10:59:22.813549

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  import itertools

  perms = list(itertools.permutations(nums))
  perms.sort()

  for perm in perms:
    print(*perm)

solve()