# Task: gen-comb-permutations-8833 | Score: 100% | 2026-02-11T10:13:02.621381

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)