# Task: gen-comb-permutations-2532 | Score: 100% | 2026-02-12T18:40:58.591698

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)