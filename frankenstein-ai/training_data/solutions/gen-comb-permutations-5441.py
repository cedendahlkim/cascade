# Task: gen-comb-permutations-5441 | Score: 100% | 2026-02-11T11:37:41.342514

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)