# Task: gen-comb-permutations-6142 | Score: 100% | 2026-02-11T09:32:24.976115

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)