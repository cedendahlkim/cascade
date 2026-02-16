# Task: gen-comb-combinations-5801 | Score: 100% | 2026-02-10T18:11:32.836060

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