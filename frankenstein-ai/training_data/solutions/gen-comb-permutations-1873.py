# Task: gen-comb-permutations-1873 | Score: 100% | 2026-02-11T11:38:44.460345

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)