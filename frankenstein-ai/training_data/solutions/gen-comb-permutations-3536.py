# Task: gen-comb-permutations-3536 | Score: 100% | 2026-02-11T12:13:24.272571

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)