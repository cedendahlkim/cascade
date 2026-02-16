# Task: gen-comb-permutations-6687 | Score: 100% | 2026-02-11T11:40:09.013800

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)