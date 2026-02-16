# Task: gen-comb-combinations-9589 | Score: 100% | 2026-02-11T10:04:21.407124

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)