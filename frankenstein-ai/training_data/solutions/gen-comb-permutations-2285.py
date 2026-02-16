# Task: gen-comb-permutations-2285 | Score: 100% | 2026-02-10T18:29:50.554399

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(' '.join(perm))