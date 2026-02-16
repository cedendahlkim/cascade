# Task: gen-comb-permutations-3160 | Score: 100% | 2026-02-11T11:21:10.927442

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)