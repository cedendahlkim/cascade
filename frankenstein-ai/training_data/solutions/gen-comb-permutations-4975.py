# Task: gen-comb-permutations-4975 | Score: 100% | 2026-02-11T09:16:33.506566

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)