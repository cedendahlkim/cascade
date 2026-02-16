# Task: gen-comb-permutations-8486 | Score: 100% | 2026-02-11T11:41:12.635944

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)