# Task: gen-comb-permutations-1226 | Score: 100% | 2026-02-11T11:17:36.998656

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)