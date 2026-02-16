# Task: gen-comb-permutations-3243 | Score: 100% | 2026-02-11T09:10:59.682811

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)