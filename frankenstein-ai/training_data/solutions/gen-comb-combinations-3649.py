# Task: gen-comb-combinations-3649 | Score: 100% | 2026-02-11T10:51:51.713192

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