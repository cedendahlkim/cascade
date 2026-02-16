# Task: gen-comb-permutations-9478 | Score: 100% | 2026-02-11T11:38:01.569554

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)