# Task: gen-comb-permutations-1902 | Score: 100% | 2026-02-11T08:39:46.049895

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)