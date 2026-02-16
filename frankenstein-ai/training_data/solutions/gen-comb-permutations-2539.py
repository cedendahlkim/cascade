# Task: gen-comb-permutations-2539 | Score: 100% | 2026-02-11T08:49:39.681152

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)