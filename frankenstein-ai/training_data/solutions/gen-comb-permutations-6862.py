# Task: gen-comb-permutations-6862 | Score: 100% | 2026-02-11T11:33:14.777854

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(' '.join(perm))