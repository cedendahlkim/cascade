# Task: gen-comb-permutations-4549 | Score: 100% | 2026-02-11T09:16:55.858845

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)