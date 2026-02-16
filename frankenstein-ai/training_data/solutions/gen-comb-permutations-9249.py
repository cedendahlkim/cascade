# Task: gen-comb-permutations-9249 | Score: 100% | 2026-02-11T11:53:28.323782

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(itertools.permutations(nums))

for perm in sorted(perms):
    print(*perm)