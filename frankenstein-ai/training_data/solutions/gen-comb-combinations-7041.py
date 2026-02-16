# Task: gen-comb-combinations-7041 | Score: 100% | 2026-02-11T11:12:06.801786

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