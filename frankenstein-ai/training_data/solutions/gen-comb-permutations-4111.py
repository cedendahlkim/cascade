# Task: gen-comb-permutations-4111 | Score: 100% | 2026-02-11T10:24:01.248245

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = sorted(list(permutations(nums)))

for perm in perms:
    print(*perm)