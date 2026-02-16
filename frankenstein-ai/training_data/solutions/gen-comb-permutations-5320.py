# Task: gen-comb-permutations-5320 | Score: 100% | 2026-02-12T16:18:39.763977

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)