# Task: gen-comb-permutations-8616 | Score: 100% | 2026-02-11T11:20:28.699188

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)