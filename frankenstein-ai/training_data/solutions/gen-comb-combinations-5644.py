# Task: gen-comb-combinations-5644 | Score: 100% | 2026-02-11T11:47:52.596300

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combination in itertools.combinations(nums, k):
    print(*combination)