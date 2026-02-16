# Task: gen-comb-combinations-9712 | Score: 100% | 2026-02-11T07:49:41.258029

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)