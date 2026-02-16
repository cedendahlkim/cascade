# Task: gen-comb-permutations-1212 | Score: 100% | 2026-02-12T14:57:33.988316

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)