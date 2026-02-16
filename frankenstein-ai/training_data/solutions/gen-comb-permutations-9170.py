# Task: gen-comb-permutations-9170 | Score: 100% | 2026-02-12T13:30:12.204459

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)