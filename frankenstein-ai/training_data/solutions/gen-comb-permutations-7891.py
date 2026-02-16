# Task: gen-comb-permutations-7891 | Score: 100% | 2026-02-11T11:54:43.452298

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)