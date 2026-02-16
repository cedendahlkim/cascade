# Task: gen-comb-permutations-9605 | Score: 100% | 2026-02-13T08:51:36.476797

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)