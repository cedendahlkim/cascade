# Task: gen-comb-combinations-9930 | Score: 100% | 2026-02-11T12:11:59.882108

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)