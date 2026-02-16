# Task: gen-comb-permutations-8245 | Score: 100% | 2026-02-13T08:37:57.336547

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)