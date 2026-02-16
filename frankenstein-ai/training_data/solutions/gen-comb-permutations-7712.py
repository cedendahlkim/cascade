# Task: gen-comb-permutations-7712 | Score: 100% | 2026-02-10T17:58:30.280187

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)