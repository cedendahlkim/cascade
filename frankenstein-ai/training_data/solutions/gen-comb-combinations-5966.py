# Task: gen-comb-combinations-5966 | Score: 100% | 2026-02-11T11:25:21.747537

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)