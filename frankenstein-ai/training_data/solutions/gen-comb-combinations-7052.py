# Task: gen-comb-combinations-7052 | Score: 100% | 2026-02-11T10:45:51.119199

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)