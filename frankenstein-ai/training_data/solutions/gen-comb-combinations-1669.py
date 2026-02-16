# Task: gen-comb-combinations-1669 | Score: 100% | 2026-02-10T18:10:50.163423

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)