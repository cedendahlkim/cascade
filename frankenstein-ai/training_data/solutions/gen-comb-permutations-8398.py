# Task: gen-comb-permutations-8398 | Score: 100% | 2026-02-11T10:23:16.954015

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)