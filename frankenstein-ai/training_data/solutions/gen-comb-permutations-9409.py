# Task: gen-comb-permutations-9409 | Score: 100% | 2026-02-11T09:59:49.268514

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = itertools.permutations(nums)

for perm in perms:
    print(*perm)