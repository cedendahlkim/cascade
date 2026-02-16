# Task: gen-comb-permutations-7491 | Score: 100% | 2026-02-11T11:28:47.075680

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = sorted(list(permutations(nums)))

for perm in perms:
  print(*perm)