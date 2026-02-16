# Task: gen-comb-permutations-3805 | Score: 100% | 2026-02-11T11:49:44.961940

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)