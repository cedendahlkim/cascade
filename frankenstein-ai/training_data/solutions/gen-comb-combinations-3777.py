# Task: gen-comb-combinations-3777 | Score: 100% | 2026-02-11T11:28:45.407899

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)