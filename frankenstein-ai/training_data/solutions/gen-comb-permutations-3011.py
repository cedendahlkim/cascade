# Task: gen-comb-permutations-3011 | Score: 100% | 2026-02-10T19:07:42.901604

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)