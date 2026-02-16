# Task: gen-comb-permutations-4874 | Score: 100% | 2026-02-10T17:59:49.510027

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(*perm)