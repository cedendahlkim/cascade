# Task: gen-comb-combinations-9083 | Score: 100% | 2026-02-11T08:53:07.484860

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)