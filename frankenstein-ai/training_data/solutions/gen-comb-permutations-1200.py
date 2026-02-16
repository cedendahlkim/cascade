# Task: gen-comb-permutations-1200 | Score: 100% | 2026-02-11T10:45:20.518238

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)