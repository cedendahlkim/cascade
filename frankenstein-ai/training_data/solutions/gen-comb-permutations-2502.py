# Task: gen-comb-permutations-2502 | Score: 100% | 2026-02-11T11:41:49.891428

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)