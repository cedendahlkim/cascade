# Task: gen-comb-permutations-3327 | Score: 100% | 2026-02-11T10:03:06.172774

import itertools

N = int(input())
nums = []
for _ in range(N):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)