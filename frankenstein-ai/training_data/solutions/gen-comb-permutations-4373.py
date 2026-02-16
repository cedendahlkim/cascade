# Task: gen-comb-permutations-4373 | Score: 100% | 2026-02-11T11:19:04.814862

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)