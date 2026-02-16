# Task: gen-comb-combinations-1149 | Score: 100% | 2026-02-11T09:12:32.607282

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

combinations = itertools.combinations(nums, k)

for comb in combinations:
    print(*comb)