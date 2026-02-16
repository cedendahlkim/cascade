# Task: gen-comb-combinations-6470 | Score: 100% | 2026-02-10T17:43:44.494563

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