# Task: gen-comb-permutations-2148 | Score: 100% | 2026-02-11T10:40:12.962161

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)