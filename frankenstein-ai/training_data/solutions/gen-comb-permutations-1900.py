# Task: gen-comb-permutations-1900 | Score: 100% | 2026-02-11T11:39:47.477853

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)