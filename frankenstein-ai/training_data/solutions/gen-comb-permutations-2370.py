# Task: gen-comb-permutations-2370 | Score: 100% | 2026-02-11T10:45:28.915875

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)