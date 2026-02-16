# Task: gen-comb-combinations-3000 | Score: 100% | 2026-02-11T11:19:52.135768

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)