# Task: gen-comb-permutations-4877 | Score: 100% | 2026-02-11T10:27:49.476495

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)