# Task: gen-comb-combinations-9245 | Score: 100% | 2026-02-11T11:43:52.619063

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)