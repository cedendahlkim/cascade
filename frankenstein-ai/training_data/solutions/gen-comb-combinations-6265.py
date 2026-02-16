# Task: gen-comb-combinations-6265 | Score: 100% | 2026-02-10T19:08:43.762152

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

combinations = list(itertools.combinations(nums, k))

for comb in combinations:
    print(*comb)