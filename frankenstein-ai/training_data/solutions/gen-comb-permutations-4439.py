# Task: gen-comb-permutations-4439 | Score: 100% | 2026-02-11T09:39:01.982956

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)