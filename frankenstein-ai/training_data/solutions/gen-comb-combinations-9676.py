# Task: gen-comb-combinations-9676 | Score: 100% | 2026-02-11T10:42:05.901135

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)