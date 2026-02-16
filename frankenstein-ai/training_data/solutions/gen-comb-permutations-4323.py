# Task: gen-comb-permutations-4323 | Score: 100% | 2026-02-10T18:56:28.587001

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)