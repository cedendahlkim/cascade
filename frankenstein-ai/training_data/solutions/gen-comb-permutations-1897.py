# Task: gen-comb-permutations-1897 | Score: 100% | 2026-02-11T11:16:01.255154

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)