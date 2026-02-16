# Task: gen-comb-permutations-5030 | Score: 100% | 2026-02-10T18:33:40.503671

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)