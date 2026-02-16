# Task: gen-comb-combinations-7565 | Score: 100% | 2026-02-11T11:47:19.266760

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)