# Task: gen-comb-permutations-2927 | Score: 100% | 2026-02-10T19:05:59.275653

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)