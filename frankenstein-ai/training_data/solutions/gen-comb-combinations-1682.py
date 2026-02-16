# Task: gen-comb-combinations-1682 | Score: 100% | 2026-02-11T09:03:03.970506

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)