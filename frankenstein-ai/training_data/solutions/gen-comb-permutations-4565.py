# Task: gen-comb-permutations-4565 | Score: 100% | 2026-02-11T12:03:28.811589

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in perms:
    print(*perm)