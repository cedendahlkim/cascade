# Task: gen-comb-permutations-7817 | Score: 100% | 2026-02-10T18:44:36.711440

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

permutations = list(itertools.permutations(nums))
permutations.sort()

for perm in permutations:
    print(' '.join(map(str, perm)))