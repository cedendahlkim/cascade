# Task: gen-comb-combinations-6981 | Score: 100% | 2026-02-11T12:14:04.286907

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)