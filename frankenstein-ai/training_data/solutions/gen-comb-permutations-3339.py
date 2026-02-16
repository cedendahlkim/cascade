# Task: gen-comb-permutations-3339 | Score: 100% | 2026-02-11T11:53:07.137547

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)