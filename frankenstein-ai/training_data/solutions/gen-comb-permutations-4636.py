# Task: gen-comb-permutations-4636 | Score: 100% | 2026-02-12T12:09:02.546765

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)