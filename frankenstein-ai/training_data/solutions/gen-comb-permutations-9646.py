# Task: gen-comb-permutations-9646 | Score: 100% | 2026-02-10T18:33:15.831813

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))

for perm in permutations:
    print(*perm)