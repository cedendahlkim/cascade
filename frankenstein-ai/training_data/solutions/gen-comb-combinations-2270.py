# Task: gen-comb-combinations-2270 | Score: 100% | 2026-02-11T11:42:45.051392

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)