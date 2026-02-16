# Task: gen-comb-permutations-7135 | Score: 100% | 2026-02-11T10:17:57.963293

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

perms = list(itertools.permutations(nums))
for perm in perms:
    print(' '.join(perm))