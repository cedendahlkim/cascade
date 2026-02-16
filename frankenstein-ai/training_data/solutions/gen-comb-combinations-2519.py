# Task: gen-comb-combinations-2519 | Score: 100% | 2026-02-11T08:57:18.051942

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)