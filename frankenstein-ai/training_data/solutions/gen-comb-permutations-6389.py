# Task: gen-comb-permutations-6389 | Score: 100% | 2026-02-11T11:16:59.724368

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)