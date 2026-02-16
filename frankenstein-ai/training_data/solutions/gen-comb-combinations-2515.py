# Task: gen-comb-combinations-2515 | Score: 100% | 2026-02-10T18:44:12.291924

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