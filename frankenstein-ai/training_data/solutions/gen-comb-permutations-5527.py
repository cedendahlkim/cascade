# Task: gen-comb-permutations-5527 | Score: 100% | 2026-02-13T08:38:02.759000

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)