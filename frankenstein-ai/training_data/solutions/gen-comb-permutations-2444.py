# Task: gen-comb-permutations-2444 | Score: 100% | 2026-02-12T20:01:20.079302

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)