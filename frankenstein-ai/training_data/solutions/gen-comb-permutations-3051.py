# Task: gen-comb-permutations-3051 | Score: 100% | 2026-02-11T08:49:58.319077

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)