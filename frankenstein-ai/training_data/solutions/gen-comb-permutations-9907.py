# Task: gen-comb-permutations-9907 | Score: 100% | 2026-02-12T16:30:33.553702

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)