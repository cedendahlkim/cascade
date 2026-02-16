# Task: gen-comb-combinations-9098 | Score: 100% | 2026-02-10T17:55:07.464934

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)