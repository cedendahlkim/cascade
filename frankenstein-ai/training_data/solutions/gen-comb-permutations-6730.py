# Task: gen-comb-permutations-6730 | Score: 100% | 2026-02-11T11:36:26.862146

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)