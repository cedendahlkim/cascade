# Task: gen-comb-combinations-1908 | Score: 100% | 2026-02-13T08:38:07.425788

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)