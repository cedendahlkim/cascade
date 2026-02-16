# Task: gen-comb-permutations-4222 | Score: 100% | 2026-02-12T12:28:14.449001

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)