# Task: gen-comb-permutations-9622 | Score: 100% | 2026-02-11T11:59:55.799217

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)