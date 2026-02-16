# Task: gen-comb-permutations-5890 | Score: 100% | 2026-02-11T10:38:51.827977

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)