# Task: gen-comb-permutations-5255 | Score: 100% | 2026-02-11T11:24:53.645165

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)