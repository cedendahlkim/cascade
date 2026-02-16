# Task: gen-comb-permutations-7734 | Score: 100% | 2026-02-11T11:24:35.835701

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

for perm in itertools.permutations(nums):
    print(*perm)