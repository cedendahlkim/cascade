# Task: gen-comb-combinations-6244 | Score: 100% | 2026-02-11T09:03:08.786536

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)