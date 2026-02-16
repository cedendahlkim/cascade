# Task: gen-comb-combinations-2041 | Score: 100% | 2026-02-11T07:29:32.520609

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for comb in combinations(nums, k):
    print(*comb)