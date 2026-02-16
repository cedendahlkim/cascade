# Task: gen-comb-combinations-8633 | Score: 100% | 2026-02-11T07:31:57.582181

from itertools import combinations

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    for combination in combinations(nums, k):
        print(*combination)

solve()