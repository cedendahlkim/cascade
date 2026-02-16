# Task: gen-comb-permutations-2898 | Score: 100% | 2026-02-11T11:10:05.224384

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)