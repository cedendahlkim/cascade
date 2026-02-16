# Task: gen-comb-combinations-1934 | Score: 100% | 2026-02-11T09:56:16.207401

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)