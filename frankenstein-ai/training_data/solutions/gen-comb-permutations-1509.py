# Task: gen-comb-permutations-1509 | Score: 100% | 2026-02-10T19:11:22.489221

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)