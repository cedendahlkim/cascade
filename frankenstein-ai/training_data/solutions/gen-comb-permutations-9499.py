# Task: gen-comb-permutations-9499 | Score: 100% | 2026-02-11T09:05:55.078965

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)