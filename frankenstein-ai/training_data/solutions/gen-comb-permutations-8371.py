# Task: gen-comb-permutations-8371 | Score: 100% | 2026-02-11T11:00:45.798077

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)