# Task: gen-comb-permutations-2424 | Score: 100% | 2026-02-11T10:39:51.611471

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)