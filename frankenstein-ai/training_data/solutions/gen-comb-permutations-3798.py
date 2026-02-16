# Task: gen-comb-permutations-3798 | Score: 100% | 2026-02-11T11:31:14.072567

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)