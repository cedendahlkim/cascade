# Task: gen-comb-permutations-3575 | Score: 100% | 2026-02-12T12:02:57.444300

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)