# Task: gen-comb-permutations-8864 | Score: 100% | 2026-02-12T14:42:18.438924

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)