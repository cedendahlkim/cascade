# Task: gen-comb-permutations-4139 | Score: 100% | 2026-02-11T09:13:30.785527

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)