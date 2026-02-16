# Task: gen-comb-permutations-3172 | Score: 100% | 2026-02-11T11:47:58.080355

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)