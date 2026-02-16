# Task: gen-comb-combinations-3454 | Score: 100% | 2026-02-11T12:10:40.360700

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    for combination in itertools.combinations(nums, k):
        print(*combination)

solve()