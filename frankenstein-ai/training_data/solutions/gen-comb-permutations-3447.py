# Task: gen-comb-permutations-3447 | Score: 100% | 2026-02-11T11:15:12.330208

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

nums.sort()

for perm in itertools.permutations(nums):
    print(*perm)