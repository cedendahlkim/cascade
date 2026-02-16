# Task: gen-comb-permutations-9476 | Score: 100% | 2026-02-10T19:06:49.698423

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = list(permutations(nums))
perms.sort()

for perm in perms:
    print(*perm)