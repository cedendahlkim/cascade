# Task: gen-comb-combinations-6971 | Score: 100% | 2026-02-11T11:31:27.181952

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)