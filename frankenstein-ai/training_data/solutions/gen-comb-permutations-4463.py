# Task: gen-comb-permutations-4463 | Score: 100% | 2026-02-11T10:26:46.689960

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)