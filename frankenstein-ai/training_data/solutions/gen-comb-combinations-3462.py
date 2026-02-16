# Task: gen-comb-combinations-3462 | Score: 100% | 2026-02-10T19:06:30.143599

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)