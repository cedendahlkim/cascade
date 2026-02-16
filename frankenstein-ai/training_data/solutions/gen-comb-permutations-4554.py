# Task: gen-comb-permutations-4554 | Score: 100% | 2026-02-11T08:55:02.941329

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)