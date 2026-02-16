# Task: gen-comb-permutations-3043 | Score: 100% | 2026-02-11T10:41:13.588489

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)