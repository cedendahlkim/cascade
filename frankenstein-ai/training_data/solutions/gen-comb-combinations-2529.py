# Task: gen-comb-combinations-2529 | Score: 100% | 2026-02-11T07:28:46.938317

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)