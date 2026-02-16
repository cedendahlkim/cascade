# Task: gen-comb-permutations-9575 | Score: 100% | 2026-02-11T10:18:35.464536

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)