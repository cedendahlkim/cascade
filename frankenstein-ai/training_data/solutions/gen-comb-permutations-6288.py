# Task: gen-comb-permutations-6288 | Score: 100% | 2026-02-11T09:25:53.704585

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)