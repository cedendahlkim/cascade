# Task: gen-comb-combinations-3520 | Score: 100% | 2026-02-12T19:53:01.054250

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)