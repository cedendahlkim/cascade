# Task: gen-comb-permutations-6155 | Score: 100% | 2026-02-13T08:49:25.204839

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)