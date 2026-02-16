# Task: gen-comb-combinations-7589 | Score: 100% | 2026-02-11T10:11:50.521819

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