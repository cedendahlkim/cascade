# Task: gen-comb-permutations-4955 | Score: 100% | 2026-02-12T12:09:17.477021

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)