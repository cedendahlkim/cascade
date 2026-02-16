# Task: gen-comb-permutations-4725 | Score: 100% | 2026-02-11T09:39:17.067288

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)