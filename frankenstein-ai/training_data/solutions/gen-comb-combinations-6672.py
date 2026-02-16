# Task: gen-comb-combinations-6672 | Score: 100% | 2026-02-11T11:25:15.019420

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)