# Task: gen-comb-combinations-2181 | Score: 100% | 2026-02-12T16:05:58.770094

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)