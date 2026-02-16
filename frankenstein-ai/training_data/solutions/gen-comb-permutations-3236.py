# Task: gen-comb-permutations-3236 | Score: 100% | 2026-02-11T07:29:30.963280

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)