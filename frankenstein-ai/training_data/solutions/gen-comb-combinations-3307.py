# Task: gen-comb-combinations-3307 | Score: 100% | 2026-02-11T09:21:18.150230

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)