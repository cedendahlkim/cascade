# Task: gen-comb-combinations-5947 | Score: 100% | 2026-02-10T19:06:22.885584

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