# Task: gen-comb-permutations-9175 | Score: 100% | 2026-02-11T10:05:00.900027

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

perms = list(permutations(nums))
perms.sort()

for perm in perms:
  print(*perm)