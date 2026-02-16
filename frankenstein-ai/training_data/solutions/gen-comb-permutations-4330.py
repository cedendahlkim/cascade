# Task: gen-comb-permutations-4330 | Score: 100% | 2026-02-11T12:09:02.417410

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)