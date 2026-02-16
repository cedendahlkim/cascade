# Task: gen-comb-permutations-4440 | Score: 100% | 2026-02-12T14:57:33.812933

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)