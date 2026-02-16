# Task: gen-comb-permutations-7830 | Score: 100% | 2026-02-10T19:08:14.234066

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)