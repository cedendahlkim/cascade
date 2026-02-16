# Task: gen-comb-permutations-7559 | Score: 100% | 2026-02-11T10:26:49.730721

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)