# Task: gen-comb-combinations-3205 | Score: 100% | 2026-02-11T11:54:07.013583

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)