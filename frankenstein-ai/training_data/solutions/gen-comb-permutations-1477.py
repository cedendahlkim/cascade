# Task: gen-comb-permutations-1477 | Score: 100% | 2026-02-12T18:47:30.640875

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)