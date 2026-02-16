# Task: gen-comb-combinations-7594 | Score: 100% | 2026-02-11T11:10:33.123557

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)