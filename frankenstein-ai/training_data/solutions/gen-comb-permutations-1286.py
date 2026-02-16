# Task: gen-comb-permutations-1286 | Score: 100% | 2026-02-10T18:33:39.158547

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)