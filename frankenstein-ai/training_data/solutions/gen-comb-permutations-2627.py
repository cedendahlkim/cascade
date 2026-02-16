# Task: gen-comb-permutations-2627 | Score: 100% | 2026-02-11T08:45:48.959271

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)