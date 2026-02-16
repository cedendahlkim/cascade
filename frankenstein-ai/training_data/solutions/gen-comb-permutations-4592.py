# Task: gen-comb-permutations-4592 | Score: 100% | 2026-02-11T11:19:06.208207

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)