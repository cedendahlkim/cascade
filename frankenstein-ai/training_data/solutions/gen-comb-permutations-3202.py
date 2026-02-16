# Task: gen-comb-permutations-3202 | Score: 100% | 2026-02-10T18:52:34.167326

from itertools import permutations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

perms = sorted(list(permutations(nums)))

for perm in perms:
    print(*perm)