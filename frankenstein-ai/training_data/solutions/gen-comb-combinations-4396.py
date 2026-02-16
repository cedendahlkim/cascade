# Task: gen-comb-combinations-4396 | Score: 100% | 2026-02-11T08:48:59.637824

import itertools

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    combinations = itertools.combinations(nums, k)
    for combo in combinations:
        print(*combo)

solve()