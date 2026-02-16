# Task: gen-comb-combinations-6473 | Score: 100% | 2026-02-12T12:39:12.732411

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)