# Task: gen-comb-permutations-3059 | Score: 100% | 2026-02-11T12:06:17.483047

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)