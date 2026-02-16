# Task: gen-comb-permutations-1177 | Score: 100% | 2026-02-11T10:16:37.428193

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)