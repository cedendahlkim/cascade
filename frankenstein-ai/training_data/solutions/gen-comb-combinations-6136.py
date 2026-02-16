# Task: gen-comb-combinations-6136 | Score: 100% | 2026-02-12T16:20:20.679645

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)