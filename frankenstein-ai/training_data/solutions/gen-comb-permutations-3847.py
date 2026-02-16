# Task: gen-comb-permutations-3847 | Score: 100% | 2026-02-12T13:51:45.643857

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)