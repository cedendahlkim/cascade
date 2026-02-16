# Task: gen-comb-combinations-8755 | Score: 100% | 2026-02-11T11:13:21.563875

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    combinations = itertools.combinations(nums, k)
    for comb in combinations:
        print(*comb)

solve()