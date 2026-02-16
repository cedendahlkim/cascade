# Task: gen-comb-permutations-9232 | Score: 100% | 2026-02-11T09:27:40.599563

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)