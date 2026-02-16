# Task: gen-comb-permutations-5080 | Score: 100% | 2026-02-11T09:39:49.791347

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
    nums.append(input())

perms = list(permutations(nums))

for perm in perms:
    print(*perm)