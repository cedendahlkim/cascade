# Task: gen-comb-permutations-6269 | Score: 100% | 2026-02-11T12:14:41.434947

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)