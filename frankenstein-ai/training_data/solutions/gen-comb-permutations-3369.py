# Task: gen-comb-permutations-3369 | Score: 100% | 2026-02-10T17:59:58.531933

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)