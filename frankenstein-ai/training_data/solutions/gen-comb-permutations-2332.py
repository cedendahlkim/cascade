# Task: gen-comb-permutations-2332 | Score: 100% | 2026-02-11T11:40:49.288800

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

nums.sort()

for perm in itertools.permutations(nums):
    print(*perm)