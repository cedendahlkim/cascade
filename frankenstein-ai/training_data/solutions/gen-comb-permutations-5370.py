# Task: gen-comb-permutations-5370 | Score: 100% | 2026-02-11T10:14:18.884085

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)