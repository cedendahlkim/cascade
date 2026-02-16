# Task: gen-comb-permutations-7364 | Score: 100% | 2026-02-11T11:39:51.681959

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in sorted(perms):
    print(*perm)