# Task: gen-comb-permutations-1789 | Score: 100% | 2026-02-12T17:08:51.662723

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)