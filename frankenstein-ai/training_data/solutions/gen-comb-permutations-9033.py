# Task: gen-comb-permutations-9033 | Score: 100% | 2026-02-11T10:11:22.844270

def solve():
  n = int(input())
  nums = []
  for _ in range(n):
    nums.append(int(input()))

  import itertools
  permutations = list(itertools.permutations(nums))

  for perm in permutations:
    print(*perm)

solve()