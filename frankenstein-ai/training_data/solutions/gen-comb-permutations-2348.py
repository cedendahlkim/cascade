# Task: gen-comb-permutations-2348 | Score: 100% | 2026-02-11T11:30:18.462661

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)