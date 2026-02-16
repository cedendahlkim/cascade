# Task: gen-comb-combinations-6104 | Score: 100% | 2026-02-11T12:03:03.812488

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)