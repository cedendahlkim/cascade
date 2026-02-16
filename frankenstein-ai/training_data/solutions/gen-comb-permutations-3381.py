# Task: gen-comb-permutations-3381 | Score: 100% | 2026-02-11T09:30:04.799588

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)