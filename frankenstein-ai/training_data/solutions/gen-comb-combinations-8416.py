# Task: gen-comb-combinations-8416 | Score: 100% | 2026-02-11T07:28:56.643730

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

for combo in combinations(nums, k):
    print(*combo)