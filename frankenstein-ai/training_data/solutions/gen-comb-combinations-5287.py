# Task: gen-comb-combinations-5287 | Score: 100% | 2026-02-11T10:30:39.194861

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)