# Task: gen-comb-permutations-9882 | Score: 100% | 2026-02-11T07:40:45.536556

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(' '.join(perm))