# Task: gen-comb-combinations-8605 | Score: 100% | 2026-02-11T10:00:00.132558

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

combs = itertools.combinations(nums, k)

for comb in combs:
    print(*comb)