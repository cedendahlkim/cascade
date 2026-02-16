# Task: gen-comb-permutations-1731 | Score: 100% | 2026-02-11T11:29:22.050193

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)