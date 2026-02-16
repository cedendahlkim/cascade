# Task: gen-comb-permutations-4181 | Score: 100% | 2026-02-11T11:13:28.310307

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)