# Task: gen-comb-combinations-7663 | Score: 100% | 2026-02-11T10:52:45.171479

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)