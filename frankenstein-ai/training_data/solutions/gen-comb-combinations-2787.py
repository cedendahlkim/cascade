# Task: gen-comb-combinations-2787 | Score: 100% | 2026-02-11T11:33:39.906459

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)