# Task: gen-comb-combinations-5200 | Score: 100% | 2026-02-12T16:20:21.017029

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)