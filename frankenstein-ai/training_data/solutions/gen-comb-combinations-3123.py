# Task: gen-comb-combinations-3123 | Score: 100% | 2026-02-12T16:05:58.984604

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)