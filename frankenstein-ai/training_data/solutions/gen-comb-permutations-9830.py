# Task: gen-comb-permutations-9830 | Score: 100% | 2026-02-11T09:13:20.229177

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
  nums.append(input())

perms = list(permutations(nums))

for perm in perms:
  print(*perm)