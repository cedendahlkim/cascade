# Task: gen-comb-combinations-5875 | Score: 100% | 2026-02-10T19:09:39.136248

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)