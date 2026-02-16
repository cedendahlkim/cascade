# Task: gen-comb-combinations-6633 | Score: 100% | 2026-02-11T11:40:52.641038

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)