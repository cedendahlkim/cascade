# Task: gen-comb-permutations-8033 | Score: 100% | 2026-02-11T11:49:19.195945

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)