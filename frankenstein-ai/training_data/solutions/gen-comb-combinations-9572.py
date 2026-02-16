# Task: gen-comb-combinations-9572 | Score: 100% | 2026-02-11T07:49:20.467588

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)