# Task: gen-comb-combinations-6457 | Score: 100% | 2026-02-11T12:07:11.403602

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)