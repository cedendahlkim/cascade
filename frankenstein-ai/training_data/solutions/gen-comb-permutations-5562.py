# Task: gen-comb-permutations-5562 | Score: 100% | 2026-02-11T11:32:59.505505

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)