# Task: gen-comb-combinations-4819 | Score: 100% | 2026-02-11T12:11:01.557809

import itertools

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in itertools.combinations(nums, k):
    print(*combo)