# Task: gen-comb-permutations-7198 | Score: 100% | 2026-02-10T19:08:22.566691

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)