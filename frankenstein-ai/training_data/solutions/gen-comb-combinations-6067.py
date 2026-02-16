# Task: gen-comb-combinations-6067 | Score: 100% | 2026-02-10T18:14:19.279739

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)