# Task: gen-comb-combinations-8557 | Score: 100% | 2026-02-11T11:10:06.580247

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

combinations = list(itertools.combinations(nums, k))

for comb in combinations:
    print(*comb)