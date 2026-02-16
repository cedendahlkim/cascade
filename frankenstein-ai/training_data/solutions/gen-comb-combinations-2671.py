# Task: gen-comb-combinations-2671 | Score: 100% | 2026-02-10T19:07:34.651490

from itertools import combinations

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))

k = int(input())

combs = list(combinations(nums, k))

for comb in combs:
    print(*comb)