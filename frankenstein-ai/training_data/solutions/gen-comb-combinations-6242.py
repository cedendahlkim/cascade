# Task: gen-comb-combinations-6242 | Score: 100% | 2026-02-11T11:46:13.444442

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)