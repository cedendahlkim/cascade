# Task: gen-comb-combinations-6776 | Score: 100% | 2026-02-11T10:29:45.114394

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)