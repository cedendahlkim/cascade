# Task: gen-comb-combinations-6404 | Score: 100% | 2026-02-11T10:35:13.401653

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