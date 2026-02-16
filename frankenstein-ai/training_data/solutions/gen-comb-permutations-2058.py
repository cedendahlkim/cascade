# Task: gen-comb-permutations-2058 | Score: 100% | 2026-02-11T08:52:49.825222

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)