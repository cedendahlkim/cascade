# Task: gen-comb-permutations-8220 | Score: 100% | 2026-02-10T18:53:32.445809

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)