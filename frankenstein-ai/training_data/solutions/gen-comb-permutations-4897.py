# Task: gen-comb-permutations-4897 | Score: 100% | 2026-02-10T18:40:31.738990

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)