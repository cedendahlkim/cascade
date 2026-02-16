# Task: gen-comb-permutations-7467 | Score: 100% | 2026-02-10T19:08:08.093856

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)