# Task: gen-comb-permutations-8070 | Score: 100% | 2026-02-11T11:38:43.009313

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)