# Task: gen-comb-permutations-7741 | Score: 100% | 2026-02-11T10:54:59.076788

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)