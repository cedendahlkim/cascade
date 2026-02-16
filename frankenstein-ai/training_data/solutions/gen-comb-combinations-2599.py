# Task: gen-comb-combinations-2599 | Score: 100% | 2026-02-11T10:25:03.842773

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)