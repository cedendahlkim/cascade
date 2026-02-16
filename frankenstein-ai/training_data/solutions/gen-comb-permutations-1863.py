# Task: gen-comb-permutations-1863 | Score: 100% | 2026-02-11T12:04:00.022842

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(' '.join(perm))